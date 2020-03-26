import { Random } from 'meteor/random';

import { BaseRaw } from './BaseRaw';
import Analytics from '../models/Analytics';

export class AnalyticsRaw extends BaseRaw {
	saveMessageSent({ room, date }) {
		return this.update({ date, 'room._id': room._id, type: 'messages' }, {
			$set: {
				room: { _id: room._id, name: room.fname || room.name, t: room.t, usernames: room.usernames || [] },
			},
			$setOnInsert: {
				_id: Random.id(),
				date,
				type: 'messages',
			},
			$inc: { messages: 1 },
		}, { upsert: true });
	}

	saveUserData({ date }) {
		return this.update({ date, type: 'users' }, {
			$setOnInsert: {
				_id: Random.id(),
				date,
				type: 'users',
			},
			$inc: { users: 1 },
		}, { upsert: true });
	}

	saveMessageDeleted({ room, date }) {
		return this.update({ date, 'room._id': room._id }, {
			$inc: { messages: -1 },
		});
	}

	getMessagesSentTotalByDate({ start, end, options = {} }) {
		const params = [
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
		];
		if (options.sort) {
			params.push({ $sort: options.sort });
		}
		if (options.count) {
			params.push({ $limit: options.count });
		}
		return this.col.aggregate(params).toArray();
	}

	getMessagesOrigin({ start, end }) {
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
		return this.col.aggregate(params).toArray();
	}

	getMostPopularChannelsByMessagesSentQuantity({ start, end, options = {} }) {
		const params = [
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
		];
		if (options.sort) {
			params.push({ $sort: options.sort });
		}
		if (options.count) {
			params.push({ $limit: options.count });
		}
		return this.col.aggregate(params).toArray();
	}

	getTotalOfRegisteredUsersByDate({ start, end, options = {} }) {
		const params = [
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
		];
		if (options.sort) {
			params.push({ $sort: options.sort });
		}
		if (options.count) {
			params.push({ $limit: options.count });
		}
		return this.col.aggregate(params).toArray();
	}

	findByTypeBeforeDate({ type, date }) {
		return this.find({ type, date: { $lte: date } });
	}
}

export default new AnalyticsRaw(Analytics.model.rawCollection());
