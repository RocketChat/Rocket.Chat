import type { IAnalytic, IRoom } from '@rocket.chat/core-typings';
import type { IAnalyticsModel } from '@rocket.chat/model-typings';
import type { AggregationCursor, FindCursor, Db, IndexDescription, FindOptions, UpdateResult, Document } from 'mongodb';
import { Random } from 'meteor/random';

import { BaseRaw } from './BaseRaw';
import { readSecondaryPreferred } from '../../database/readSecondaryPreferred';

export class AnalyticsRaw extends BaseRaw<IAnalytic> implements IAnalyticsModel {
	constructor(db: Db) {
		super(db, 'analytics', undefined, {
			collection: { readPreference: readSecondaryPreferred(db) },
		});
	}

	protected modelIndexes(): IndexDescription[] {
		return [{ key: { date: 1 } }, { key: { 'room._id': 1, 'date': 1 }, unique: true }];
	}

	saveMessageSent({ room, date }: { room: IRoom; date: IAnalytic['date'] }): Promise<Document | UpdateResult> {
		return this.updateMany(
			{ date, 'room._id': room._id, 'type': 'messages' },
			{
				$set: {
					room: {
						_id: room._id,
						name: room.fname || room.name,
						t: room.t,
						usernames: room.usernames || [],
					},
				},
				$setOnInsert: {
					_id: Random.id(),
					date,
					type: 'messages',
				},
				$inc: { messages: 1 },
			},
			{ upsert: true },
		);
	}

	saveUserData({ date }: { date: IAnalytic['date'] }): Promise<Document | UpdateResult> {
		return this.updateMany(
			{ date, type: 'users' },
			{
				$setOnInsert: {
					_id: Random.id(),
					date,
					type: 'users',
				},
				$inc: { users: 1 },
			},
			{ upsert: true },
		);
	}

	saveMessageDeleted({ room, date }: { room: { _id: string }; date: IAnalytic['date'] }): Promise<Document | UpdateResult> {
		return this.updateMany(
			{ date, 'room._id': room._id },
			{
				$inc: { messages: -1 },
			},
		);
	}

	getMessagesSentTotalByDate({
		start,
		end,
		options = {},
	}: {
		start: IAnalytic['date'];
		end: IAnalytic['date'];
		options?: { sort?: FindOptions<IAnalytic>['sort']; count?: number };
	}): AggregationCursor<{
		_id: IAnalytic['date'];
		messages: number;
	}> {
		return this.col.aggregate<{
			_id: IAnalytic['date'];
			messages: number;
		}>(
			[
				{
					$match: {
						type: 'messages',
						date: { $gte: start, $lte: end },
					},
				},
				{
					$group: {
						_id: '$date',
						messages: { $sum: '$messages' },
					},
				},
				...(options.sort ? [{ $sort: options.sort }] : []),
				...(options.count ? [{ $limit: options.count }] : []),
			],
			{ readPreference: readSecondaryPreferred() },
		);
	}

	getMessagesOrigin({ start, end }: { start: IAnalytic['date']; end: IAnalytic['date'] }): AggregationCursor<{
		t: IRoom['t'];
		messages: number;
	}> {
		const params = [
			{
				$match: {
					type: 'messages',
					date: { $gte: start, $lte: end },
				},
			},
			{
				$group: {
					_id: { t: '$room.t' },
					messages: { $sum: '$messages' },
				},
			},
			{
				$project: {
					_id: 0,
					t: '$_id.t',
					messages: 1,
				},
			},
		];
		return this.col.aggregate(params, { readPreference: readSecondaryPreferred() });
	}

	getMostPopularChannelsByMessagesSentQuantity({
		start,
		end,
		options = {},
	}: {
		start: IAnalytic['date'];
		end: IAnalytic['date'];
		options?: { sort?: FindOptions<IAnalytic>['sort']; count?: number };
	}): AggregationCursor<{
		t: IRoom['t'];
		name: string;
		messages: number;
		usernames: string[];
	}> {
		return this.col.aggregate(
			[
				{
					$match: {
						type: 'messages',
						date: { $gte: start, $lte: end },
					},
				},
				{
					$group: {
						_id: { t: '$room.t', name: '$room.name', usernames: '$room.usernames' },
						messages: { $sum: '$messages' },
					},
				},
				{
					$project: {
						_id: 0,
						t: '$_id.t',
						name: '$_id.name',
						usernames: '$_id.usernames',
						messages: 1,
					},
				},
				...(options.sort ? [{ $sort: options.sort }] : []),
				...(options.count ? [{ $limit: options.count }] : []),
			],
			{ readPreference: readSecondaryPreferred() },
		);
	}

	getTotalOfRegisteredUsersByDate({
		start,
		end,
		options = {},
	}: {
		start: IAnalytic['date'];
		end: IAnalytic['date'];
		options?: { sort?: FindOptions<IAnalytic>['sort']; count?: number };
	}): AggregationCursor<{
		_id: IAnalytic['date'];
		users: number;
	}> {
		return this.col.aggregate<{
			_id: IAnalytic['date'];
			users: number;
		}>(
			[
				{
					$match: {
						type: 'users',
						date: { $gte: start, $lte: end },
					},
				},
				{
					$group: {
						_id: '$date',
						users: { $sum: '$users' },
					},
				},
				...(options.sort ? [{ $sort: options.sort }] : []),
				...(options.count ? [{ $limit: options.count }] : []),
			],
			{ readPreference: readSecondaryPreferred() },
		);
	}

	findByTypeBeforeDate({ type, date }: { type: IAnalytic['type']; date: IAnalytic['date'] }): FindCursor<IAnalytic> {
		return this.find({ type, date: { $lte: date } });
	}
}
