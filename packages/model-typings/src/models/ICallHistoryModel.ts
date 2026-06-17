import type { CallHistoryItem, IRegisterUser, IUser } from '@rocket.chat/core-typings';
import type { FindCursor, FindOptions } from 'mongodb';

import type { FindPaginated, IBaseModel } from './IBaseModel';

export interface ICallHistoryModel extends IBaseModel<CallHistoryItem> {
	findOneByIdAndUid(
		_id: CallHistoryItem['_id'],
		uid: CallHistoryItem['uid'],
		options?: FindOptions<CallHistoryItem>,
	): Promise<CallHistoryItem | null>;

	findOneByCallIdAndUid(
		callId: CallHistoryItem['callId'],
		uid: CallHistoryItem['uid'],
		options?: FindOptions<CallHistoryItem>,
	): Promise<CallHistoryItem | null>;

	findAllByUserIdAndSearchFilters(
		uid: IUser['_id'],
		filters: {
			type?: CallHistoryItem['type'];
			searchTerm?: string;
			direction?: CallHistoryItem['direction'];
			inStates?: CallHistoryItem['state'][];
		},
		options: FindOptions<CallHistoryItem>,
	): FindPaginated<FindCursor<CallHistoryItem>>;

	updateUserReferences(userId: IRegisterUser['_id'], username: IRegisterUser['username'], name?: IRegisterUser['name']): Promise<void>;
}
