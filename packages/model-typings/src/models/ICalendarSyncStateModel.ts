import type { ICalendarSyncState, ICalendarSyncStateError, IUser } from '@rocket.chat/core-typings';
import type { DeleteResult, UpdateResult } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

export interface ICalendarSyncStateModel extends IBaseModel<ICalendarSyncState> {
	findOneByUserId(uid: IUser['_id']): Promise<ICalendarSyncState | null>;
	recordSuccess(
		uid: IUser['_id'],
		data: {
			mailbox: string;
			provider: ICalendarSyncState['provider'];
			at: Date;
			deltaToken?: string;
			deltaWindowStart?: Date;
			deltaWindowEnd?: Date;
		},
	): Promise<UpdateResult>;
	recordFailure(
		uid: IUser['_id'],
		data: {
			mailbox: string;
			provider: ICalendarSyncState['provider'];
			error: ICalendarSyncStateError;
		},
	): Promise<UpdateResult>;
	removeByUserId(uid: IUser['_id']): Promise<DeleteResult>;
	removeAll(): Promise<DeleteResult>;
}
