import type { INotification, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { INotificationQueueModel } from '@rocket.chat/model-typings';
import type { Collection, Db, Document, IndexDescription, UpdateResult } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class NotificationQueueRaw extends BaseRaw<INotification> implements INotificationQueueModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<INotification>>) {
		super(db, 'notification_queue', trash);
	}

	protected modelIndexes(): IndexDescription[] {
		return [
			{ key: { uid: 1 } },
			{ key: { ts: 1 }, expireAfterSeconds: 2 * 60 * 60 },
			{ key: { schedule: 1 }, sparse: true },
			{ key: { sending: 1 }, sparse: true },
			{ key: { error: 1 }, sparse: true },
		];
	}

	unsetSendingById(_id: string): Promise<UpdateResult> {
		return this.updateOne(
			{ _id },
			{
				$unset: {
					sending: 1,
				},
			},
		);
	}

	setErrorById(_id: string, error: any): Promise<UpdateResult> {
		return this.updateOne(
			{
				_id,
			},
			{
				$set: {
					error,
				},
				$unset: {
					sending: 1,
				},
			},
		);
	}

	clearScheduleByUserId(uid: string): Promise<UpdateResult | Document> {
		return this.updateMany(
			{
				uid,
				schedule: { $exists: true },
			},
			{
				$unset: {
					schedule: 1,
				},
			},
		);
	}

	async clearQueueByUserId(uid: string): Promise<number | undefined> {
		const op = await this.deleteMany({
			uid,
		});

		return op.deletedCount;
	}

	async findNextInQueueOrExpired(expired: Date): Promise<INotification | null> {
		const now = new Date();

		const result = await this.findOneAndUpdate(
			{
				$and: [
					{
						$or: [{ sending: { $exists: false } }, { sending: { $lte: expired } }],
					},
					{
						$or: [{ schedule: { $exists: false } }, { schedule: { $lte: now } }],
					},
					{
						error: { $exists: false },
					},
				],
			},
			{
				$set: {
					sending: now,
				},
			},
			{
				sort: {
					ts: 1,
				},
			},
		);

		return result;
	}
}
