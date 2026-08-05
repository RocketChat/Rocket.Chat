import type { CallHistoryItem, IRegisterUser, IUser } from '@rocket.chat/core-typings';
import type { FindCursor, FindOptions } from 'mongodb';

import type { FindPaginated, IBaseModel, InsertionModel } from './IBaseModel';

export interface ICallHistoryModel extends IBaseModel<CallHistoryItem> {
	/**
	 * Writes an item per member, replacing what was there for the same member and call.
	 *
	 * A conference is logged when it starts and again as it changes, so these writes repeat for the same call by
	 * design — `{ uid, callId }` is unique, and that is what makes repeating them harmless.
	 */
	upsertMany(items: InsertionModel<CallHistoryItem>[]): Promise<void>;

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
