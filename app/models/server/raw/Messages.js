import { BaseRaw } from './BaseRaw';

export class MessagesRaw extends BaseRaw {
	findStarredByUserAtRoom(userId, roomId, options) {
		const query = {
			_hidden: { $ne: true },
			'starred._id': userId,
			rid: roomId,
		};

		return this.find(query, options);
	}

	findByRoomIdAndType(roomId, type, options) {
		const query = {
			rid: roomId,
			t: type,
		};

		if (options == null) { options = {}; }

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

	findDiscussionByRoomId({ rid, oldest, latest, inclusive, text, excludePinned, ignoreThreads, fromUsers = [], queryOptions = {} }) {
		const query = {
			rid,
			drid: { $exists: 1 },
		};

		if (oldest || latest) {
			let ts;
			if (oldest) {
				inclusive
					? ts.$gte = oldest
					: ts.$gt = oldest;
			}

			if (latest) {
				inclusive
					? ts.$lte = latest
					: ts.$lt = latest;
			}

			query.ts = ts;
		}

		if (excludePinned) {
			query.pinned = { $ne: true };
		}

		if (text) {
			query.$text.$search = text;
		}

		if (fromUsers.length) {
			query['u.username'] = { $in: fromUsers };
		}

		if (ignoreThreads) {
			query.tmid = { $exists: 0 };
			query.tcount = { $exists: 0 };
		}

		return this.find(query, queryOptions);
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
							$cond: [{ $ifNull: ['$room.fname', false] },
								'$room.fname',
								'$room.name'],
						},
						t: '$room.t',
						usernames: {
							$cond: [{ $ifNull: ['$room.usernames', false] },
								'$room.usernames',
								[]],
						},
						date: {
							$concat: [
								{ $substr: ['$ts', 0, 4] },
								{ $substr: ['$ts', 5, 2] },
								{ $substr: ['$ts', 8, 2] },
							],
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

	findVisibleByRoomId({ rid, latest, oldest, excludeTypes, queryOptions, inclusive, mentionsUsername, snippeted }) {
		const query = {
			_hidden: {
				$ne: true,
			},

			rid,
		};

		if (Array.isArray(excludeTypes) && excludeTypes.length > 0) {
			query.t = { $nin: excludeTypes };
		}

		if (mentionsUsername) {
			query['mentions.username'] = mentionsUsername;
		}

		if (snippeted) {
			query.snippeted = true;
		}

		if (latest && oldest) {
			return this.findVisibleByRoomIdBetweenTimestamps(rid, oldest, latest, excludeTypes, queryOptions);
		}

		if (latest && !oldest) {
			return this.findVisibleByRoomIdBeforeTimestamp(rid, latest, queryOptions, inclusive);
		}

		if (!latest && oldest) {
			return this.findVisibleByRoomIdAfterTimestamp(rid, oldest, queryOptions);
		}

		return this.find(query, queryOptions);
	}


	findVisibleByRoomIdBeforeTimestamp(roomId, timestamp, options, inclusive) {
		const timestampKey = inclusive ? '$lte' : '$lt';
		const query = {
			_hidden: {
				$ne: true,
			},
			rid: roomId,
			ts: {
				[timestampKey]: timestamp,
			},
		};

		return this.find(query, options);
	}


	findVisibleByRoomIdBetweenTimestamps(roomId, afterTimestamp, beforeTimestamp, options) {
		const query = {
			_hidden: {
				$ne: true,
			},
			rid: roomId,
			ts: {
				$gt: afterTimestamp,
				$lt: beforeTimestamp,
			},
		};

		return this.find(query, options);
	}

	findVisibleByRoomIdAfterTimestamp(roomId, timestamp, options) {
		const query = {
			_hidden: {
				$ne: true,
			},
			rid: roomId,
			ts: {
				$gt: timestamp,
			},
		};

		return this.find(query, options);
	}

	findForUpdates(roomId, timestamp, options) {
		const query = {
			_hidden: {
				$ne: true,
			},
			rid: roomId,
			_updatedAt: {
				$gt: timestamp,
			},
		};
		return this.find(query, options);
	}

	findFilesByRoomId({ rid, excludePinned, ignoreDiscussion = true, fromUsers = [], ignoreThreads = true, queryOptions = {}, oldest, latest, inclusive }) {
		const query = {
			rid,
			'file._id': { $exists: true },
		};

		if (oldest) {
			if (inclusive) {
				query.ts.$gte = oldest;
			} else {
				query.ts.$gt = oldest;
			}
		}

		if (latest) {
			if (inclusive) {
				query.ts.$lte = latest;
			} else {
				query.ts.$lt = latest;
			}
		}

		if (excludePinned) {
			query.pinned = { $ne: true };
		}

		if (ignoreThreads) {
			query.tmid = { $exists: 0 };
			query.tcount = { $exists: 0 };
		}

		if (ignoreDiscussion) {
			query.drid = { $exists: 0 };
		}

		if (fromUsers.length) {
			query['u.username'] = { $in: fromUsers };
		}

		return this.find(query, { fields: { 'file._id': 1 }, ...queryOptions });
	}

	findThreadsByRoomId({ rid, pinned, ignoreDiscussion = true, latest, oldest, inclusive, fromUsers = [], queryOptions }) {
		const query = {
			rid,
			tlm: { $exists: 1 },
			tcount: { $exists: 1 },
		};

		if (oldest || latest) {
			let ts;
			if (oldest) {
				inclusive
					? ts.$gte = oldest
					: ts.$gt = oldest;
			}

			if (latest) {
				inclusive
					? ts.$lte = latest
					: ts.$lt = latest;
			}

			query.ts = ts;
		}

		if (pinned) {
			query.pinned = { $ne: true };
		}

		if (ignoreDiscussion) {
			query.drid = { $exists: 0 };
		}

		if (fromUsers.length > 0) {
			query['u.username'] = { $in: fromUsers };
		}

		return this.find(query, queryOptions);
	}


	findVisibleThreadByThreadId(tmid, options) {
		const query = {
			_hidden: {
				$ne: true,
			},

			tmid,
		};

		return this.find(query, options);
	}
}
