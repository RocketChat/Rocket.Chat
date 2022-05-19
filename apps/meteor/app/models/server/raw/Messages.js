import { escapeRegExp } from '@rocket.chat/string-helpers';

import { BaseRaw } from './BaseRaw';

export class MessagesRaw extends BaseRaw {
	findVisibleByMentionAndRoomId(username, rid, options) {
		const query = {
			'_hidden': { $ne: true },
			'mentions.username': username,
			rid,
		};

		return this.find(query, options);
	}

	findStarredByUserAtRoom(userId, roomId, options) {
		const query = {
			'_hidden': { $ne: true },
			'starred._id': userId,
			'rid': roomId,
		};

		return this.find(query, options);
	}

	findByRoomIdAndType(roomId, type, options) {
		const query = {
			rid: roomId,
			t: type,
		};

		if (options == null) {
			options = {};
		}

		return this.find(query, options);
	}

	findSnippetedByRoom(roomId, options) {
		const query = {
			_hidden: { $ne: true },
			snippeted: true,
			rid: roomId,
		};

		return this.find(query, options);
	}

	findDiscussionsByRoom(rid, options) {
		const query = { rid, drid: { $exists: true } };

		return this.find(query, options);
	}

	findDiscussionsByRoomAndText(rid, text, options) {
		const query = {
			rid,
			drid: { $exists: true },
			msg: new RegExp(escapeRegExp(text), 'i'),
		};

		return this.find(query, options);
	}

	findAllNumberOfTransferredRooms({ start, end, departmentId, onlyCount = false, options = {} }) {
		const match = {
			$match: {
				t: 'livechat_transfer_history',
				ts: { $gte: new Date(start), $lte: new Date(end) },
			},
		};
		const lookup = {
			$lookup: {
				from: 'rocketchat_room',
				localField: 'rid',
				foreignField: '_id',
				as: 'room',
			},
		};
		const unwind = {
			$unwind: {
				path: '$room',
				preserveNullAndEmptyArrays: true,
			},
		};
		const group = {
			$group: {
				_id: {
					_id: null,
					departmentId: '$room.departmentId',
				},
				numberOfTransferredRooms: { $sum: 1 },
			},
		};
		const project = {
			$project: {
				_id: { $ifNull: ['$_id.departmentId', null] },
				numberOfTransferredRooms: 1,
			},
		};
		const firstParams = [match, lookup, unwind];
		if (departmentId) {
			firstParams.push({
				$match: {
					'room.departmentId': departmentId,
				},
			});
		}
		const sort = { $sort: options.sort || { name: 1 } };
		const params = [...firstParams, group, project, sort];
		if (onlyCount) {
			params.push({ $count: 'total' });
			return this.col.aggregate(params);
		}
		if (options.offset) {
			params.push({ $skip: options.offset });
		}
		if (options.count) {
			params.push({ $limit: options.count });
		}
		return this.col.aggregate(params, { allowDiskUse: true });
	}

	getTotalOfMessagesSentByDate({ start, end, options = {} }) {
		const params = [
			{ $match: { t: { $exists: false }, ts: { $gte: start, $lte: end } } },
			{
				$lookup: {
					from: 'rocketchat_room',
					localField: 'rid',
					foreignField: '_id',
					as: 'room',
				},
			},
			{
				$unwind: {
					path: '$room',
				},
			},
			{
				$group: {
					_id: {
						_id: '$room._id',
						name: {
							$cond: [{ $ifNull: ['$room.fname', false] }, '$room.fname', '$room.name'],
						},
						t: '$room.t',
						usernames: {
							$cond: [{ $ifNull: ['$room.usernames', false] }, '$room.usernames', []],
						},
						date: {
							$concat: [{ $substr: ['$ts', 0, 4] }, { $substr: ['$ts', 5, 2] }, { $substr: ['$ts', 8, 2] }],
						},
					},
					messages: { $sum: 1 },
				},
			},
			{
				$project: {
					_id: 0,
					date: '$_id.date',
					room: {
						_id: '$_id._id',
						name: '$_id.name',
						t: '$_id.t',
						usernames: '$_id.usernames',
					},
					type: 'messages',
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

	findLivechatClosedMessages(rid, options) {
		return this.find(
			{
				rid,
				$or: [{ t: { $exists: false } }, { t: 'livechat-close' }],
			},
			options,
		);
	}

	async countRoomsWithStarredMessages(options) {
		const [queryResult] = await this.col
			.aggregate(
				[{ $match: { 'starred._id': { $exists: true } } }, { $group: { _id: '$rid' } }, { $group: { _id: null, total: { $sum: 1 } } }],
				options,
			)
			.toArray();

		return queryResult?.total || 0;
	}

	async countRoomsWithPinnedMessages(options) {
		const [queryResult] = await this.col
			.aggregate([{ $match: { pinned: true } }, { $group: { _id: '$rid' } }, { $group: { _id: null, total: { $sum: 1 } } }], options)
			.toArray();

		return queryResult?.total || 0;
	}

	async countE2EEMessages(options) {
		return this.find({ t: 'e2e' }, options).count();
	}

	findPinned(options) {
		const query = {
			t: { $ne: 'rm' },
			_hidden: { $ne: true },
			pinned: true,
		};

		return this.find(query, options);
	}

	findStarred(options) {
		const query = {
			'_hidden': { $ne: true },
			'starred._id': { $exists: true },
		};

		return this.find(query, options);
	}
}
