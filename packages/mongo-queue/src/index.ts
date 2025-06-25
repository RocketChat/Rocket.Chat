import type { Db, Filter, ObjectId, UpdateFilter, Document } from 'mongodb';

import type { WorkerPromise, Actions, Work } from './types';

// TODO... what indexes should be created and should this be responsible for creating them?
export class MessageQueue {
	errorHandler: (...args: any) => void = console.error;

	databasePromise: (() => Promise<Db>) | null = null;

	collectionName = '_queue';

	pollingInterval = 1000;

	processingTimeout = 30 * 1000;

	maxWorkers = 5;

	_workers: Record<string, WorkerPromise<any>> = {};

	_numWorkers = 0;

	_pollingIntervalId: NodeJS.Timeout | null = null;

	registerWorker<T>(type: Actions, worker: WorkerPromise<T>) {
		this._workers[type] = worker;
		this._startPolling();
	}

	stopPolling() {
		this._stopPolling();
	}

	enqueue<T>(type: Actions, message: T, options?: { nextReceivableTime: Date; priority: number }): Promise<ObjectId> {
		const queueItem: Work<T> = {
			dateCreated: new Date(),
			type,
			message,
		};

		if (options?.nextReceivableTime) {
			queueItem.nextReceivableTime = options.nextReceivableTime;
		}

		// The priority range is 1-10, 1 being the highest.
		queueItem.priority = options?.priority || 1;

		return this._enqueue(queueItem);
	}

	async enqueueAndProcess<T extends Work<any>>(
		type: Actions,
		message: T,
		_options?: { nextReceivableTime: Date; priority: number },
	): Promise<number> {
		const queueItem: Work<T> = {
			dateCreated: new Date(),
			type,
			message,
			receivedTime: new Date(),
		};

		await this._enqueue(queueItem);
		return this._process(queueItem);
	}

	removeOne<T, C extends Document = Work<T>>(type: Actions, messageQuery: Filter<C>) {
		const query = this._buildQueueItemQuery(type, messageQuery);
		return this._removeOne(query);
	}

	removeMany<T, C extends Document = Work<T>>(type: Actions, messageQuery: Filter<C>) {
		const query = this._buildQueueItemQuery(type, messageQuery);
		return this._removeMany(query);
	}

	updateOne<T, C extends Document = Work<T>>(
		type: Actions,
		messageQuery: Filter<C>,
		messageUpdate: UpdateFilter<C>,
		options: { nextReceivableTime?: Date } = {},
	) {
		const query = this._buildQueueItemQuery(type, messageQuery);
		const update = this._buildQueueItemUpdate(messageUpdate, options);
		return this._updateOne(query, update);
	}

	updateMany<T, C extends Document = Work<T>>(
		type: Actions,
		messageQuery: Filter<C>,
		messageUpdate: UpdateFilter<C>,
		options: { nextReceivableTime?: Date } = {},
	) {
		const query = this._buildQueueItemQuery(type, messageQuery);
		const update = this._buildQueueItemUpdate(messageUpdate, options);
		return this._updateMany(query, update);
	}

	_startPolling() {
		if (!this._pollingIntervalId) {
			// Try and find work at least once every pollingInterval
			this._pollingIntervalId = setInterval(this._poll, this.pollingInterval);
		}
	}

	_stopPolling() {
		if (this._pollingIntervalId) {
			clearInterval(this._pollingIntervalId);
		}
	}

	async _poll() {
		if (this._numWorkers < this.maxWorkers) {
			this._numWorkers += 1;

			try {
				const queueItem = await this._receive();

				if (queueItem) {
					await this._process(queueItem);

					// Look for more work to do immediately if we just processed something
					// TODO: should we?
					setImmediate(this._poll);
				}
			} catch (err) {
				this.errorHandler(err);
			} finally {
				this._numWorkers -= 1;
			}
		}
	}

	async _process<T extends Work<any>>(queueItem: T) {
		const worker = this._workers[queueItem.type];
		if (!worker) {
			throw new Error(`No worker registered for type: ${queueItem.type}`);
		}

		const status = await worker(queueItem);
		switch (status) {
			case 'Completed':
				return this._removeOneById(queueItem._id!);
			case 'Retry':
				return this._release(queueItem);
			case 'Rejected':
				return this._reject(queueItem);
			default:
				throw new Error(`Unknown status: ${status}`);
		}
	}

	async _enqueue<T>(queueItem: Work<T>) {
		const collection = await this._getCollection();
		const result = await collection.insertOne(queueItem);

		return result?.insertedId;
	}

	_release(queueItem: Work<unknown>) {
		const update: UpdateFilter<Work<unknown>> = {
			$unset: {
				receivedTime: 1 as const,
			},
			$set: {
				retryCount: queueItem.retryCount ? queueItem.retryCount + 1 : 1,
				nextReceivableTime: queueItem.nextReceivableTime ? queueItem.nextReceivableTime : new Date(),
			},
			$push: {
				releaseHistory: {
					retryCount: queueItem.retryCount ? queueItem.retryCount || 0 : 0,
					receivedTime: queueItem.receivedTime,
					releasedTime: new Date(),
					releasedReason: queueItem.releasedReason || 'No reason provided',
				} as any,
			},
		};

		return this._updateOneById(queueItem._id!, update);
	}

	_reject(queueItem: Work<unknown>) {
		const update: UpdateFilter<Work<unknown>> = {
			$unset: {
				receivedTime: 1,
				nextReceivableTime: 1,
			},
			$set: {
				rejectedTime: new Date(),
				rejectionReason: queueItem.rejectionReason,
			},
			$push: {
				releaseHistory: {
					retryCount: queueItem.retryCount ? queueItem.retryCount : 0,
					receivedTime: queueItem.receivedTime,
					releasedTime: new Date(),
					releasedReason: queueItem.releasedReason,
				} as any,
			},
		};

		return this._updateOneById(queueItem._id!, update);
	}

	async _receive() {
		const query: Filter<Work<unknown>> = {
			type: { $in: Object.keys(this._workers) },
			rejectedTime: { $exists: false },
			$and: [
				{
					$or: [{ nextReceivableTime: { $lt: new Date() } }, { nextReceivableTime: { $exists: false } }],
				},
				{
					$or: [{ receivedTime: { $lt: new Date(Date.now() - this.processingTimeout) } }, { receivedTime: { $exists: false } }],
				},
			],
		};
		const update = {
			$set: {
				receivedTime: new Date(),
			},
		};

		const collection = await this._getCollection<Work<unknown>>();
		return collection.findOneAndUpdate(query, update, { returnDocument: 'after', sort: 'priority' });
	}

	_buildQueueItemQuery<T>(type: Actions, messageQuery: Filter<T>): Filter<T> {
		const query: Filter<any> = { type };

		Object.keys(messageQuery).forEach((key) => {
			const property = `message.${key}`;
			query[property] = messageQuery[key];
		});

		return query;
	}

	_buildQueueItemUpdate<T>(messageUpdate: UpdateFilter<T>, options: { nextReceivableTime?: Date } = {}) {
		const update: Filter<any> = {};
		const $set: UpdateFilter<any>['$set'] = {};

		if (options.nextReceivableTime) {
			$set.nextReceivableTime = options.nextReceivableTime;
		}

		Object.keys(messageUpdate).forEach((key) => {
			const property = `message.${key}`;
			$set[property] = messageUpdate[key];
		});

		if (Object.keys($set).length) {
			update.$set = $set;
		}

		return update;
	}

	async _getCollection<T extends Document>() {
		if (!this.databasePromise) {
			throw new Error('No database configured');
		}
		const db = await this.databasePromise();
		return db.collection<T>(this.collectionName);
	}

	async _removeOne<T, C extends Document = Work<T>>(query: Filter<C>) {
		const collection = await this._getCollection<C>();
		const result = await collection.deleteOne(query);
		return result.deletedCount;
	}

	_removeOneById(id: ObjectId) {
		return this._removeOne({ _id: id });
	}

	async _removeMany<T, C extends Document = Work<T>>(query: Filter<C>) {
		const collection = await this._getCollection<C>();
		const result = await collection.deleteMany(query);
		return result.deletedCount;
	}

	async _updateOne<T, C extends Document = Work<T>>(query: Filter<C>, update: UpdateFilter<C>) {
		const collection = await this._getCollection<C>();
		const result = await collection.updateOne(query, update);
		return result.modifiedCount;
	}

	_updateOneById<T, C = Work<T>>(id: ObjectId, update: UpdateFilter<C>) {
		return this._updateOne<{ _id: ObjectId }>({ _id: id }, update);
	}

	async _updateMany<T, C extends Document = Work<T>>(query: Filter<C>, update: UpdateFilter<C>) {
		const collection = await this._getCollection<C>();
		const result = await collection.updateMany(query, update);
		return result.modifiedCount;
	}
}

export { Actions, WorkerPromise, Work, ValidResult } from './types';
