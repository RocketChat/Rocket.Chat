import type { CallHistoryItem, IRegisterUser, IUser } from '@rocket.chat/core-typings';
import type {
	FindPaginated,
	ICallHistoryModel,
	DocumentWithProjection,
	FindOptionsWithProjection,
	InsertionModel,
} from '@rocket.chat/model-typings';
import { escapeRegExp } from '@rocket.chat/tools';
import type { Db, Filter, FindCursor, IndexDescription, Document } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class CallHistoryRaw extends BaseRaw<CallHistoryItem> implements ICallHistoryModel {
	constructor(db: Db) {
		super(db, 'call_history');
	}

	protected override modelIndexes(): IndexDescription[] {
		return [{ key: { uid: 1, callId: 1 }, unique: true }, { key: { uid: 1, ts: -1 } }];
	}

	async findOneByIdAndUid<T extends Document = CallHistoryItem, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		_id: CallHistoryItem['_id'],
		uid: CallHistoryItem['uid'],
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null> {
		return this.findOne<T, O>({ _id, uid }, options);
	}

	async findOneByCallIdAndUid<T extends Document = CallHistoryItem, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		callId: CallHistoryItem['callId'],
		uid: CallHistoryItem['uid'],
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null> {
		return this.findOne<T, O>({ callId, uid }, options);
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

	public findAllByUserIdAndSearchFilters<
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
		options?: O,
	): FindPaginated<FindCursor<DocumentWithProjection<T, O>>> {
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
					{
						type: 'mitel',
						contactNumber: textSearch,
					},
				],
			}),
		};

		return this.findPaginated<T, O>(query, options);
	}

	public async importHistoryItem(data: InsertionModel<CallHistoryItem>): Promise<CallHistoryItem['_id'] | null> {
		const { _id, _updatedAt, uid, callId, ...documentData } = data;

		const result = await this.findOneAndUpdate(
			{
				uid,
				callId,
			},
			{ $set: documentData, $setOnInsert: { uid, callId } },
			{ returnDocument: 'after', projection: { _id: 1 }, upsert: true },
		);

		if (!result) {
			return null;
		}

		return result._id;
	}
}
