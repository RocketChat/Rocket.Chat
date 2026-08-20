import type { CallHistoryItem, IRegisterUser, IUser } from '@rocket.chat/core-typings';
import type { FindPaginated, ICallHistoryModel, DocumentWithProjection, FindOptionsWithProjection } from '@rocket.chat/model-typings';
import { escapeRegExp } from '@rocket.chat/tools';
import type { Db, Filter, FindCursor, FindOptions, IndexDescription, Document } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class CallHistoryRaw extends BaseRaw<CallHistoryItem> implements ICallHistoryModel {
	constructor(db: Db) {
		super(db, 'call_history');
	}

	protected override modelIndexes(): IndexDescription[] {
		return [
			{ key: { uid: 1, callId: 1 }, unique: true },
			{ key: { uid: 1, ts: -1 } },
			// Serves the workspace-wide, every-user scans that back the apps-engine reader.
			// The compound index above cannot: a query with no `uid` skips its prefix.
			{ key: { ts: -1 } },
			{ key: { callId: 1 } },
		];
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
				],
			}),
		};

		return this.findPaginated<T, O>(query, options);
	}

	/**
	 * Every row recorded for one call, across all of its participants.
	 *
	 * An internal call has two: the caller's outbound row and the callee's inbound row.
	 */
	public findByCallId(callId: CallHistoryItem['callId'], options: FindOptions<CallHistoryItem> = {}): FindCursor<CallHistoryItem> {
		return this.find({ callId }, options);
	}

	/**
	 * Searches across every user's history, newest call first.
	 *
	 * Unlike {@link findAllByUserIdAndSearchFilters} the `uid` is optional here, so this is
	 * the only read on this model that is not anchored to one user. `type` is always pinned
	 * by the caller rather than defaulted, so a new history variant cannot start appearing in
	 * results by accident.
	 */
	public findPaginatedByFilters(
		filters: {
			type: CallHistoryItem['type'];
			uid?: IUser['_id'];
			direction?: CallHistoryItem['direction'];
			inStates?: CallHistoryItem['state'][];
			from?: Date;
			to?: Date;
		},
		options: FindOptions<CallHistoryItem> = {},
	): FindPaginated<FindCursor<CallHistoryItem>> {
		const { type, uid, direction, inStates, from, to } = filters;

		const query: Filter<CallHistoryItem> = {
			type,
			...(uid && { uid }),
			...(direction && { direction }),
			...(inStates?.length && { state: { $in: inStates } }),
			...((from || to) && {
				ts: {
					...(from && { $gte: from }),
					...(to && { $lte: to }),
				},
			}),
		};

		return this.findPaginated(query, options);
	}
}
