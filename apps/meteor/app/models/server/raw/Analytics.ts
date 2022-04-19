import { Random } from 'meteor/random';
import { AggregationCursor, Cursor, SortOptionObject, UpdateWriteOpResult } from 'mongodb';
import type { IAnalytic, IRoom } from '@rocket.chat/core-typings';

import { BaseRaw, IndexSpecification } from './BaseRaw';

type T = IAnalytic;

export class AnalyticsRaw extends BaseRaw<T> {
	protected modelIndexes(): IndexSpecification[] {
		return [{ key: { date: 1 } }, { key: { 'room._id': 1, 'date': 1 }, unique: true }];
	}

	saveMessageSent({ room, date }: { room: IRoom; date: IAnalytic['date'] }): Promise<UpdateWriteOpResult> {
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

	saveUserData({ date }: { date: IAnalytic['date'] }): Promise<UpdateWriteOpResult> {
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

	saveMessageDeleted({ room, date }: { room: { _id: string }; date: IAnalytic['date'] }): Promise<UpdateWriteOpResult> {
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
		options?: { sort?: SortOptionObject<T>; count?: number };
	}): AggregationCursor<{
		_id: IAnalytic['date'];
		messages: number;
	}> {
		return this.col.aggregate<{
			_id: IAnalytic['date'];
			messages: number;
		}>([
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
		]);
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
		return this.col.aggregate(params);
	}

	getMostPopularChannelsByMessagesSentQuantity({
		start,
		end,
		options = {},
	}: {
		start: IAnalytic['date'];
		end: IAnalytic['date'];
		options?: { sort?: SortOptionObject<T>; count?: number };
	}): AggregationCursor<{
		t: IRoom['t'];
		name: string;
		messages: number;
		usernames: string[];
	}> {
		return this.col.aggregate([
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
		]);
	}

	getTotalOfRegisteredUsersByDate({
		start,
		end,
		options = {},
	}: {
		start: IAnalytic['date'];
		end: IAnalytic['date'];
		options?: { sort?: SortOptionObject<T>; count?: number };
	}): AggregationCursor<{
		_id: IAnalytic['date'];
		users: number;
	}> {
		return this.col.aggregate<{
			_id: IAnalytic['date'];
			users: number;
		}>([
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
		]);
	}

	findByTypeBeforeDate({ type, date }: { type: T['type']; date: T['date'] }): Cursor<T> {
		return this.find({ type, date: { $lte: date } });
	}
}
