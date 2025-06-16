import type { IAnalytic, IRoom } from '@rocket.chat/core-typings';
import type { IAnalyticsModel, IChannelsWithNumberOfMessagesBetweenDate } from '@rocket.chat/model-typings';
import { Random } from '@rocket.chat/random';
import type { AggregationCursor, FindCursor, Db, IndexDescription, FindOptions, UpdateResult, Document, Collection } from 'mongodb';

import { BaseRaw } from './BaseRaw';
import { readSecondaryPreferred } from '../readSecondaryPreferred';

export class AnalyticsRaw extends BaseRaw<IAnalytic> implements IAnalyticsModel {
	constructor(db: Db) {
		super(db, 'analytics', undefined, {
			collection: { readPreference: readSecondaryPreferred(db) },
		});
	}

	protected modelIndexes(): IndexDescription[] {
		return [
			{ key: { date: 1 } },
			{ key: { 'room._id': 1, 'date': 1 }, unique: true, partialFilterExpression: { type: 'rooms' } },
			{ key: { 'room.t': 1, 'date': 1 }, partialFilterExpression: { type: 'messages' } },
		];
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
					type: 'messages' as const,
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
					type: 'users' as const,
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

	getRoomsWithNumberOfMessagesBetweenDateQuery({
		types,
		start,
		end,
		startOfLastWeek,
		endOfLastWeek,
		options,
	}: {
		types: Array<IRoom['t']>;
		start: number;
		end: number;
		startOfLastWeek: number;
		endOfLastWeek: number;
		options?: any;
	}) {
		const typeAndDateMatch = {
			$match: {
				'type': 'messages',
				'room.t': { $in: types },
				'date': { $gte: startOfLastWeek, $lte: end },
			},
		};
		const roomsGroup = {
			$group: {
				_id: '$room._id',
				room: { $first: '$room' },
				messages: { $sum: { $cond: [{ $gte: ['$date', start] }, '$messages', 0] } },
				lastWeekMessages: { $sum: { $cond: [{ $lte: ['$date', endOfLastWeek] }, '$messages', 0] } },
			},
		};
		const lookup = {
			$lookup: {
				from: 'rocketchat_room',
				localField: '_id',
				foreignField: '_id',
				as: 'room',
			},
		};
		const roomsUnwind = {
			$unwind: {
				path: '$room',
				preserveNullAndEmptyArrays: false,
			},
		};
		const project = {
			$project: {
				_id: 0,
				room: {
					_id: '$room._id',
					name: { $ifNull: ['$room.name', '$room.fname'] },
					ts: '$room.ts',
					t: '$room.t',
					_updatedAt: '$room._updatedAt',
					usernames: '$room.usernames',
				},
				messages: '$messages',
				lastWeekMessages: '$lastWeekMessages',
				diffFromLastWeek: { $subtract: ['$messages', '$lastWeekMessages'] },
			},
		};

		const sort = { $sort: options?.sort || { messages: -1 } };
		const sortAndPaginationParams: Exclude<Parameters<Collection<IRoom>['aggregate']>[0], undefined> = [sort];
		if (options?.offset) {
			sortAndPaginationParams.push({ $skip: options.offset });
		}

		if (options?.count) {
			sortAndPaginationParams.push({ $limit: options.count });
		}
		const facet = {
			$facet: {
				channels: [...sortAndPaginationParams],
				total: [{ $count: 'total' }],
			},
		};
		const totalUnwind = { $unwind: '$total' };
		const totalProject = {
			$project: {
				channels: '$channels',
				total: '$total.total',
			},
		};

		const params: Exclude<Parameters<Collection<IRoom>['aggregate']>[0], undefined> = [
			typeAndDateMatch,
			roomsGroup,
			lookup,
			roomsUnwind,
			project,
			facet,
			totalUnwind,
			totalProject,
		];

		return params;
	}

	findRoomsByTypesWithNumberOfMessagesBetweenDate(params: {
		types: Array<IRoom['t']>;
		start: number;
		end: number;
		startOfLastWeek: number;
		endOfLastWeek: number;
		options?: any;
	}): AggregationCursor<{ channels: IChannelsWithNumberOfMessagesBetweenDate[]; total: number }> {
		const aggregationParams = this.getRoomsWithNumberOfMessagesBetweenDateQuery(params);
		return this.col.aggregate<{ channels: IChannelsWithNumberOfMessagesBetweenDate[]; total: number }>(aggregationParams, {
			allowDiskUse: true,
			readPreference: readSecondaryPreferred(),
		});
	}
}
