import type { CallHistoryItem, IRegisterUser, IUser } from '@rocket.chat/core-typings';
import type { FindCursor, Document, FindOptions } from 'mongodb';

import type { FindPaginated, IBaseModel } from './IBaseModel';
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

	findByCallId(callId: CallHistoryItem['callId'], options?: FindOptions<CallHistoryItem>): FindCursor<CallHistoryItem>;

	findPaginatedByFilters(
		filters: {
			type: CallHistoryItem['type'];
			uid?: IUser['_id'];
			direction?: CallHistoryItem['direction'];
			inStates?: CallHistoryItem['state'][];
			from?: Date;
			to?: Date;
		},
		options?: FindOptions<CallHistoryItem>,
	): FindPaginated<FindCursor<CallHistoryItem>>;

	updateUserReferences(userId: IRegisterUser['_id'], username: IRegisterUser['username'], name?: IRegisterUser['name']): Promise<void>;
}
