import type { CallHistoryItem, IRegisterUser, IUser } from '@rocket.chat/core-typings';
import type { FindPaginated, ICallHistoryModel } from '@rocket.chat/model-typings';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import type { Db, Filter, FindCursor, FindOptions, IndexDescription } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class CallHistoryRaw extends BaseRaw<CallHistoryItem> implements ICallHistoryModel {
	constructor(db: Db) {
		super(db, 'call_history');
	}

	protected override modelIndexes(): IndexDescription[] {
		return [{ key: { uid: 1, callId: 1 }, unique: true }, { key: { uid: 1, ts: -1 } }];
	}

	async findOneByIdAndUid(
		_id: CallHistoryItem['_id'],
		uid: CallHistoryItem['uid'],
		options?: FindOptions<CallHistoryItem>,
	): Promise<CallHistoryItem | null> {
		return this.findOne({ _id, uid }, options);
	}

	async findOneByCallIdAndUid(
		callId: CallHistoryItem['callId'],
		uid: CallHistoryItem['uid'],
		options?: FindOptions<CallHistoryItem>,
	): Promise<CallHistoryItem | null> {
		return this.findOne({ callId, uid }, options);
	}

	public async updateUserReferences(
		userId: IRegisterUser['_id'],
		username: IRegisterUser['username'],
		name?: IRegisterUser['name'],
	): Promise<void> {
		await this.updateMany(
			{
				contactId: userId,
			},
			{
				$set: {
					contactUsername: username,
					...(name && { contactName: name }),
				},
			},
		);
	}

	public findAllByUserIdAndSearchFilters(
		uid: IUser['_id'],
		filters: {
			type?: CallHistoryItem['type'];
			searchTerm?: string;
			direction?: CallHistoryItem['direction'];
			inStates?: CallHistoryItem['state'][];
		},
		options: FindOptions<CallHistoryItem>,
	): FindPaginated<FindCursor<CallHistoryItem>> {
		const { type, direction, inStates, searchTerm } = filters;

		const textSearch = searchTerm ? { $regex: escapeRegExp(searchTerm), $options: 'i' } : null;

		const query: Filter<CallHistoryItem> = {
			uid,
			...(type && { type }),
			...(direction && { direction }),
			...(inStates?.length && { state: { $in: inStates } }),
			...(textSearch && {
				$or: [
					{
						contactName: textSearch,
					},
					{
						external: false,
						contactUsername: textSearch,
					},
					{
						external: true,
						contactExtension: textSearch,
					},
				],
			}),
		};

		return this.findPaginated(query, options);
	}
}
