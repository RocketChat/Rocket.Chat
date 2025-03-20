import type { IImportRecord } from '@rocket.chat/core-typings';
import { Logger } from '@rocket.chat/logger';
import { ImportData } from '@rocket.chat/models';
import { Random } from '@rocket.chat/random';
import { type FindCursor, ObjectId } from 'mongodb';

import { ConverterCache } from './ConverterCache';
import type { IConversionCallbacks } from '../../definitions/IConversionCallbacks';

export type RecordConverterOptions = {
	workInMemory?: boolean;
	deleteDbData?: boolean;
};

export class RecordConverter<R extends IImportRecord, T extends RecordConverterOptions = RecordConverterOptions> {
	protected _logger: Logger;

	protected _cache: ConverterCache;

	protected _converterOptions: RecordConverterOptions;

	protected _options: Omit<T, keyof RecordConverterOptions>;

	protected _records: R[];

	protected skippedCount = 0;

	protected failedCount = 0;

	protected newCount = 0;

	public aborted = false;

	constructor(options?: T, logger?: Logger, cache?: ConverterCache) {
		const { workInMemory = false, deleteDbData = false, ...customOptions } = options || ({} as T);
		this._converterOptions = {
			workInMemory,
			deleteDbData,
		};
		this._options = customOptions;

		this._logger = logger || new Logger(`Data Importer - ${this.constructor.name}`);
		this._cache = cache || new ConverterCache();
		this._records = [];
	}

	private skipMemoryRecord(_id: string): void {
		const record = this.getMemoryRecordById(_id);
		if (!record) {
			return;
		}

		record.skipped = true;
	}

	private async skipDatabaseRecord(_id: string): Promise<void> {
		await ImportData.updateOne(
			{
				_id,
			},
			{
				$set: {
					skipped: true,
				},
			},
		);
	}

	protected async skipRecord(_id: string): Promise<void> {
		this.skippedCount++;
		this.skipMemoryRecord(_id);
		if (!this._converterOptions.workInMemory) {
			return this.skipDatabaseRecord(_id);
		}
	}

	private saveErrorToMemory(importId: string, error: Error): void {
		const record = this.getMemoryRecordById(importId);

		if (!record) {
			return;
		}

		if (!record.errors) {
			record.errors = [];
		}

		record.errors.push({
			message: error.message,
			stack: error.stack,
		});
	}

	private async saveErrorToDatabase(importId: string, error: Error): Promise<void> {
		await ImportData.updateOne(
			{
				_id: importId,
			},
			{
				$push: {
					errors: {
						message: error.message,
						stack: error.stack,
					},
				},
			},
		);
	}

	protected async saveError(importId: string, error: Error): Promise<void> {
		this._logger.error(error);
		this.saveErrorToMemory(importId, error);

		if (!this._converterOptions.workInMemory) {
			return this.saveErrorToDatabase(importId, error);
		}
	}

	public async clearImportData(): Promise<void> {
		this._records = [];

		// On regular import operations this data will be deleted by the importer class with one single operation for all dataTypes (aka with no filter)
		if (!this._converterOptions.workInMemory && this._converterOptions.deleteDbData) {
			await ImportData.col.deleteMany({ dataType: this.getDataType() });
		}
	}

	public async clearSuccessfullyImportedData(): Promise<void> {
		this._records = this._records.filter((record) => !record.errors?.length);

		// On regular import operations this data will be deleted by the importer class with one single operation for all dataTypes (aka with no filter)
		if (!this._converterOptions.workInMemory && this._converterOptions.deleteDbData) {
			await ImportData.col.deleteMany({ dataType: this.getDataType(), error: { $exists: false } });
		}
	}

	private getMemoryRecordById(id: string): R | undefined {
		for (const record of this._records) {
			if (record._id === id) {
				return record;
			}
		}

		return undefined;
	}

	protected getDataType(): R['dataType'] {
		throw new Error('Unspecified type');
	}

	protected async addObjectToDatabase(data: R['data'], options: R['options'] = {}): Promise<void> {
		await ImportData.col.insertOne({
			_id: new ObjectId().toHexString(),
			data,
			dataType: this.getDataType(),
			options,
		});
	}

	public addObjectToMemory(data: R['data'], options: R['options'] = {}): void {
		this._records.push({
			_id: Random.id(),
			data,
			dataType: this.getDataType(),
			options,
		} as R);
	}

	public async addObject(data: R['data'], options: R['options'] = {}): Promise<void> {
		if (this._converterOptions.workInMemory) {
			return this.addObjectToMemory(data, options);
		}

		return this.addObjectToDatabase(data, options);
	}

	protected getDatabaseDataToImport(): Promise<R[]> {
		return (ImportData.find({ dataType: this.getDataType() }) as FindCursor<R>).toArray();
	}

	protected async getDataToImport(): Promise<R[]> {
		if (this._converterOptions.workInMemory) {
			return this._records;
		}

		const dbRecords = await this.getDatabaseDataToImport();
		if (this._records.length) {
			return [...this._records, ...dbRecords];
		}

		return dbRecords;
	}

	protected async iterateRecords({
		beforeImportFn,
		afterImportFn,
		onErrorFn,
		processRecord,
		afterBatchFn,
	}: IConversionCallbacks & { processRecord?: (record: R) => Promise<boolean | undefined> } = {}): Promise<void> {
		const records = await this.getDataToImport();

		this.skippedCount = 0;
		this.failedCount = 0;
		this.newCount = 0;

		for await (const record of records) {
			const { _id } = record;
			if (this.aborted) {
				return;
			}

			try {
				if (beforeImportFn && !(await beforeImportFn(record))) {
					await this.skipRecord(_id);
					continue;
				}

				const isNew = await (processRecord || this.convertRecord).call(this, record);

				if (typeof isNew === 'boolean') {
					this.newCount++;
					if (afterImportFn) {
						await afterImportFn(record, isNew);
					}
				}
			} catch (e) {
				this.failedCount++;
				await this.saveError(_id, e instanceof Error ? e : new Error(String(e)));
				if (onErrorFn) {
					await onErrorFn();
				}
			}
		}
		if (afterBatchFn) {
			await afterBatchFn(this.newCount, this.failedCount);
		}
	}

	async convertData(callbacks: IConversionCallbacks = {}): Promise<void> {
		return this.iterateRecords(callbacks);
	}

	protected async convertRecord(_record: R): Promise<boolean | undefined> {
		return undefined;
	}
}
