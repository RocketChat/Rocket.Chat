import type { ICalendarSyncState, ICalendarSyncStateError, IUser, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { ICalendarSyncStateModel } from '@rocket.chat/model-typings';
import type { Collection, Db, DeleteResult, IndexDescription, UpdateResult } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class CalendarSyncStateRaw extends BaseRaw<ICalendarSyncState> implements ICalendarSyncStateModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<ICalendarSyncState>>) {
		super(db, 'calendar_sync_state', trash);
	}

	protected override modelIndexes(): IndexDescription[] {
		return [
			{
				key: { uid: 1 },
				unique: true,
			},
		];
	}

	public async findOneByUserId(uid: IUser['_id']): Promise<ICalendarSyncState | null> {
		return this.findOne({ uid });
	}

	public async recordSuccess(
		uid: IUser['_id'],
		{
			mailbox,
			provider,
			at,
			deltaToken,
			deltaWindowStart,
			deltaWindowEnd,
		}: {
			mailbox: string;
			provider: ICalendarSyncState['provider'];
			at: Date;
			deltaToken?: string;
			deltaWindowStart?: Date;
			deltaWindowEnd?: Date;
		},
	): Promise<UpdateResult> {
		return this.updateOne(
			{ uid },
			{
				$set: {
					mailbox,
					provider,
					lastSyncAt: at,
					lastSuccessAt: at,
					consecutiveFailures: 0,
					...(deltaToken !== undefined && { deltaToken, deltaWindowStart, deltaWindowEnd }),
				},
				$unset: {
					lastError: 1,
					...(deltaToken === undefined && { deltaToken: 1, deltaWindowStart: 1, deltaWindowEnd: 1 }),
				},
			},
			{ upsert: true },
		);
	}

	public async recordFailure(
		uid: IUser['_id'],
		{
			mailbox,
			provider,
			error,
		}: {
			mailbox: string;
			provider: ICalendarSyncState['provider'];
			error: ICalendarSyncStateError;
		},
	): Promise<UpdateResult> {
		return this.updateOne(
			{ uid },
			{
				$set: {
					mailbox,
					provider,
					lastSyncAt: error.at,
					lastError: error,
				},
				$inc: { consecutiveFailures: 1 },
			},
			{ upsert: true },
		);
	}

	public async findOneBySubscriptionId(subscriptionId: string): Promise<ICalendarSyncState | null> {
		return this.findOne({ subscriptionId });
	}

	public async setSubscription(
		uid: IUser['_id'],
		{ id, expiresAt, clientState }: { id: string; expiresAt: Date; clientState: string },
	): Promise<UpdateResult> {
		return this.updateOne(
			{ uid },
			{
				$set: {
					subscriptionId: id,
					subscriptionExpiresAt: expiresAt,
					subscriptionClientState: clientState,
				},
			},
		);
	}

	public async clearSubscription(uid: IUser['_id']): Promise<UpdateResult> {
		return this.updateOne({ uid }, { $unset: { subscriptionId: 1, subscriptionExpiresAt: 1, subscriptionClientState: 1 } });
	}

	public async removeByUserId(uid: IUser['_id']): Promise<DeleteResult> {
		return this.deleteOne({ uid });
	}

	public async removeAll(): Promise<DeleteResult> {
		return this.deleteMany({});
	}
}
