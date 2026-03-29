import type { INotificationHistory } from '@rocket.chat/core-typings';
import type { DeleteResult, FindCursor, WithId } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

export interface INotificationHistoryModel extends IBaseModel<INotificationHistory> {
	findPaginatedByUserId(
		userId: string,
		options: { limit: number; skip: number; type?: INotificationHistory['type'] },
	): { cursor: FindCursor<WithId<INotificationHistory>>; totalCount: Promise<number> };

	deleteOneByIdAndUserId(_id: string, userId: string): Promise<DeleteResult>;

	deleteAllByUserId(userId: string): Promise<DeleteResult>;
}