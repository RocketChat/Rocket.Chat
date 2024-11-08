import { performance } from 'perf_hooks';

import { MongoClient } from 'mongodb';
import type { CollectionOptions, Db, Collection } from 'mongodb';

import { SEMATTRS_DB_MONGODB_QUERY_ARGS, SEMATTRS_DB_OPERATION, SEMATTRS_DB_MONGODB_COLLECTION } from '../../observability';
import type { ILogger, IMetricCounter, IMetricHistogram, IMetrics, ITracing } from '../../observability';
import type { DBCredentials, DBUrlCredentials, IDBDriver } from '../definition';
import type { IMongoDBInteractor, IMongoDBReaderInteractor } from './definition';

export class MongoDBDriver implements IDBDriver {
	private db: Db | null = null;

	private counterOperationsMap: Map<string, IMetricCounter> = new Map();

	private perfOperationsMap: Map<string, IMetricHistogram> = new Map();

	private dbReadOperations: Record<string, { converterFnName?: string }> = {
		aggregate: {
			converterFnName: 'toArray',
		},
		listCollections: {
			converterFnName: 'toArray',
		},
		profilingLevel: {},
		watch: {},
		stats: {},
		readConcern: {},
		readPreference: {},
		secondaryOk: {},
	};

	private dbWriteOperations = ['createIndex', 'dropCollection', 'writeConcern', 'createCollection', 'renameCollection'];

	private collectionReadOperations: Record<string, { converterFnName?: string }> = {
		aggregate: {
			converterFnName: 'toArray',
		},
		listIndexes: {
			converterFnName: 'toArray',
		},
		find: {
			converterFnName: 'toArray',
		},
		count: {},
		countDocuments: {},
		distinct: {},
		estimatedDocumentCount: {},
		findOne: {},
		hint: {},
		indexExists: {},
		indexInformation: {},
		indexes: {},
		watch: {},
		stats: {},
		isCapped: {},
	};

	private collectionWriteOperations = [
		'updateOne',
		'updateMany',
		'insertOne',
		'insertMany',
		'deleteMany',
		'deleteOne',
		'dropIndex',
		'dropIndexes',
		'findOneAndDelete',
		'findOneAndUpdate',
		'bulkWrite',
	];

	constructor(private tracing: ITracing, private metrics: IMetrics, private logger: ILogger) {
		this.createMapForMetrics();
	}

	public async connectWithURL({ url, database }: DBUrlCredentials): Promise<void> {
		try {
			const client = new MongoClient(url, { maxPoolSize: 5 });
			const connection = await client.connect();
			this.db = connection.db(database);
		} catch (error) {
			this.logger.error(error as any);
			console.error(error);
			process.exit(1);
		}
	}

	public async connectWithCredentials({ database, user, password, databaseHost, databasePort }: DBCredentials): Promise<void> {
		try {
			const uri = `mongodb://${user}:${password}@${databaseHost}:${databasePort}`;
			const client = new MongoClient(uri, { maxPoolSize: 5 });
			const connection = await client.connect();
			this.db = connection.db(database);
		} catch (error) {
			this.logger.error(error as any);
			console.error(error);
			process.exit(1);
		}
	}

	public getConnection<Db>(): Db {
		if (!this.db) {
			throw new Error('Cannot retrieve a MongoDB connection, try to connect it first.');
		}

		return this.db as Db;
	}

	public getIDBInteractor(): IMongoDBInteractor {
		if (!this.db) {
			throw new Error('Cannot retrieve a MongoDB Interactor, try to connect it first.');
		}
		const readOperations = this.getIDBReaderInteractor();
		return {
			...readOperations,
			collection: <TSchema extends Document = Document>(name: string, options?: CollectionOptions) => {
				if (!this.db) {
					throw new Error('Cannot retrieve a MongoDB Interactor, try to connect it first.');
				}
				const collection = this.db.collection<TSchema>(name, options);

				return {
					...readOperations.collection(name),
					...this.createDriverFns({
						keys: this.collectionWriteOperations,
						// TODO: fix this type
						executor: collection as any,
						operations: this.collectionWriteOperations,
						collectionName: name,
					}),
				};
			},
			...this.createDriverFns({
				keys: this.dbWriteOperations,
				executor: this.db as any,
				operations: this.dbWriteOperations,
				metricMapPrefix: 'db-',
			}),
		} as unknown as IMongoDBInteractor; // TODO: fix this type
	}

	public getIDBReaderInteractor(): IMongoDBReaderInteractor {
		if (!this.db) {
			throw new Error('Cannot retrieve a MongoDB Reader Interactor, try to connect it first.');
		}

		return {
			...this.createDriverFns({
				keys: Object.keys(this.dbReadOperations),
				metricMapPrefix: 'db-',
				executor: this.db,
				operations: this.dbReadOperations,
			}),
			collection: <TSchema extends Document = Document>(name: string, options?: CollectionOptions) => {
				if (!this.db) {
					throw new Error('Cannot retrieve a MongoDB Reader Interactor, try to connect it first.');
				}
				const collection = this.db.collection<TSchema>(name, options);

				return this.createDriverFns({
					keys: Object.keys(this.collectionReadOperations),
					// TODO: fix this type
					executor: collection as any,
					operations: this.collectionReadOperations,
					collectionName: name,
				});
			},
		} as unknown as IMongoDBReaderInteractor; // TODO: fix this type
	}

	private createDriverFns({
		keys,
		metricMapPrefix,
		executor,
		operations,
		collectionName,
	}: {
		keys: string[];
		operations: Record<string, { converterFnName?: string }> | string[];
		executor: Db | Collection;
		metricMapPrefix?: string;
		collectionName?: string;
	}): Record<string, (...args: any[]) => Promise<any>> {
		return keys.reduce(
			(acc, operation) => ({
				...acc,
				[operation]: (...args: any[]): Promise<any> => {
					const performanceHistogram = this.perfOperationsMap.get(`${metricMapPrefix || ''}${operation}`);
					const operationCounter = this.counterOperationsMap.get(`${metricMapPrefix || ''}${operation}`);
					// TODO: fix this type
					const operationFn: any = (executor as any)[operation].bind(executor);
					if (!operationFn) {
						throw new Error(`Unknown MongoDB Driver ${operation} operation`);
					}
					const areWriteOperations = Array.isArray(operations);
					if (areWriteOperations) {
						if (!performanceHistogram || !operationCounter) {
							return operationFn(...args);
						}

						return this.traceDBCall({
							operation,
							collectionName,
							performanceHistogram,
							operationCounter,
							args,
							fn: (...args: any) => operationFn(...args),
						});
					}

					const { converterFnName } = operations[operation];
					if (!performanceHistogram || !operationCounter) {
						return converterFnName ? operationFn(...args)[converterFnName]() : operationFn(...args);
					}

					return this.traceDBCall({
						operation,
						collectionName,
						performanceHistogram,
						operationCounter,
						args,
						fn: (...args: any): Promise<any> => {
							return converterFnName ? operationFn(...args)[converterFnName]() : operationFn(...args);
						},
					});
				},
			}),
			{},
		);
	}

	private traceDBCall<T>({
		operation,
		fn,
		args,
		operationCounter,
		performanceHistogram,
		collectionName,
	}: {
		operation: string;
		fn: (...args: any[]) => Promise<T>;
		performanceHistogram: IMetricHistogram;
		operationCounter: IMetricCounter;
		args: any[];
		collectionName?: string;
	}): Promise<T> {
		const tracer = this.tracing.createTrace('MongoDB Driver');

		return tracer.startNewSpan<T>(`MongoDBDriver-${operation}`, async (span) => {
			let startTime;
			try {
				if (collectionName) {
					span.setAttribute(SEMATTRS_DB_MONGODB_COLLECTION, collectionName);
				}
				span.setAttribute(SEMATTRS_DB_OPERATION, operation);
				span.setAttribute(SEMATTRS_DB_MONGODB_QUERY_ARGS, JSON.stringify(args));
				span.addEvent(`Starting ${operation} DB command`);
				operationCounter.add({ value: 1 });
				startTime = performance.now();

				return await fn(...args);
			} catch (error: any) {
				span.addEvent(`DB command for ${operation} ended with failure`);
				this.logger.error(`DB command for ${operation} ended with failure`);
				span.recordException(error);
				span.end();
				throw error;
			} finally {
				if (startTime) {
					const duration = performance.now() - startTime;
					performanceHistogram.record({ value: duration, attributes: { query: `${collectionName}-${operation}` } });
				}
				span.addEvent(`DB command for ${operation} ended successfully`);
				this.logger.info(`DB command for ${operation} ended successfully`);
				span.end();
			}
		});
	}

	private createMapForMetrics(): void {
		const counterMetricFactory = this.metrics.createMetric('MongoDB Operations Count');
		const latencyMetricFactory = this.metrics.createMetric('MongoDB Operations Latency');
		[
			...Object.keys(this.collectionReadOperations),
			...this.collectionWriteOperations,
			...Object.keys(this.dbReadOperations).map((operation) => `db-${operation}`),
			...this.dbWriteOperations.map((operation) => `db-${operation}`),
		].forEach((operation) => {
			this.counterOperationsMap.set(
				operation,
				counterMetricFactory.createCounter({ name: `${operation}-count`, description: `Metric to count ${operation} operations` }),
			);
			this.perfOperationsMap.set(
				operation,
				latencyMetricFactory.createHistogram({
					name: `${operation}-latency`,
					description: `Metric to measure ${operation} latency`,
					unit: 'ms',
				}),
			);
		});
	}
}
