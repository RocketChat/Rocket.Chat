import type { CallHistoryItem, IRegisterUser, IUser } from '@rocket.chat/core-typings';
import type { FindCursor, Document } from 'mongodb';

import type { FindPaginated, IBaseModel, InsertionModel } from './IBaseModel';
import type { DocumentWithProjection, FindOptionsWithProjection } from '../types/DocumentWithProjection';

export interface ICallHistoryModel extends IBaseModel<CallHistoryItem> {
	findOneByIdAndUid<T extends Document = CallHistoryItem, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		_id: CallHistoryItem['_id'],
		uid: CallHistoryItem['uid'],
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null>;

	findOneByCallIdAndUid<T extends Document = CallHistoryItem, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		callId: CallHistoryItem['callId'],
		uid: CallHistoryItem['uid'],
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null>;

	findAllByUserIdAndSearchFilters<
		T extends Document = CallHistoryItem,
		O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>,
	>(
		uid: IUser['_id'],
		filters: {
			type?: CallHistoryItem['type'];
			searchTerm?: string;
			direction?: CallHistoryItem['direction'];
			inStates?: CallHistoryItem['state'][];
		},
		options: O,
	): FindPaginated<FindCursor<DocumentWithProjection<T, O>>>;

	updateUserReferences(userId: IRegisterUser['_id'], username: IRegisterUser['username'], name?: IRegisterUser['name']): Promise<void>;

	importHistoryItem(data: InsertionModel<CallHistoryItem>): Promise<CallHistoryItem['_id'] | null>;
}
