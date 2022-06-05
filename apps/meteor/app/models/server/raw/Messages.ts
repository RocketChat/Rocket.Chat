import { escapeRegExp } from '@rocket.chat/string-helpers';
import type { IMessage, IRoom, IUser, MessageTypesValues, ILivechatDepartment } from '@rocket.chat/core-typings';
import type { PaginatedRequest } from '@rocket.chat/rest-typings';
import type {
	AggregationCursor,
	Cursor,
	FilterQuery,
	FindOneOptions,
	WithoutProjection,
	Collection,
	CollectionAggregationOptions,
} from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class MessagesRaw extends BaseRaw<IMessage> {
	findVisibleByMentionAndRoomId(
		username: IUser['username'],
		rid: IRoom['_id'],
		options: WithoutProjection<FindOneOptions<IMessage>>,
	): Cursor<IMessage> {
		const query: FilterQuery<IMessage> = {
			'_hidden': { $ne: true },
			'mentions.username': username,
			rid,
		};

		return this.find(query, options);
	}

	findStarredByUserAtRoom(
		userId: IUser['_id'],
		roomId: IRoom['_id'],
		options: WithoutProjection<FindOneOptions<IMessage>>,
	): Cursor<IMessage> {
		const query: FilterQuery<IMessage> = {
			'_hidden': { $ne: true },
			'starred._id': userId,
			'rid': roomId,
		};

		return this.find(query, options);
	}

	findByRoomIdAndType(
		roomId: IRoom['_id'],
		type: IMessage['t'],
		options: WithoutProjection<FindOneOptions<IMessage>> = {},
	): Cursor<IMessage> {
		const query: FilterQuery<IMessage> = {
			rid: roomId,
			t: type,
		};

		return this.find(query, options);
	}

	findSnippetedByRoom(roomId: IRoom['_id'], options: WithoutProjection<FindOneOptions<IMessage>>): Cursor<IMessage> {
		const query: FilterQuery<IMessage> = {
			_hidden: { $ne: true },
			snippeted: true,
			rid: roomId,
		};

		return this.find(query, options);
	}

	// TODO: do we need this? currently not used anywhere
	findDiscussionsByRoom(rid: IRoom['_id'], options: WithoutProjection<FindOneOptions<IMessage>>): Cursor<IMessage> {
		const query: FilterQuery<IMessage> = { rid, drid: { $exists: true } };

		return this.find(query, options);
	}

	findDiscussionsByRoomAndText(rid: IRoom['_id'], text: string, options: WithoutProjection<FindOneOptions<IMessage>>): Cursor<IMessage> {
		const query: FilterQuery<IMessage> = {
			rid,
			drid: { $exists: true },
			msg: new RegExp(escapeRegExp(text), 'i'),
		};

		return this.find(query, options);
	}

	findAllNumberOfTransferredRooms({
		start,
		end,
		departmentId,
		onlyCount = false,
		options = {},
	}: {
		start: string;
		end: string;
		departmentId: ILivechatDepartment['_id'];
		onlyCount: boolean;
		options: PaginatedRequest;
	}): AggregationCursor<any> {
		// FIXME: aggregation type definitions
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
		const firstParams: Exclude<Parameters<Collection<IMessage>['aggregate']>[0], undefined> = [match, lookup, unwind];
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

	getTotalOfMessagesSentByDate({ start, end, options = {} }: { start: Date; end: Date; options?: PaginatedRequest }): Promise<any[]> {
		const params: Exclude<Parameters<Collection<IMessage>['aggregate']>[0], undefined> = [
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

	findLivechatClosedMessages(rid: IRoom['_id'], options: WithoutProjection<FindOneOptions<IMessage>>): Cursor<IMessage> {
		return this.find(
			{
				rid,
				$or: [{ t: { $exists: false } }, { t: 'livechat-close' }],
			},
			options,
		);
	}

	async countRoomsWithStarredMessages(options: CollectionAggregationOptions): Promise<number> {
		const queryResult = await this.col
			.aggregate<{ _id: null; total: number }>(
				[
					{ $match: { 'starred._id': { $exists: true } } },
					{ $group: { _id: '$rid' } },
					{
						$group: {
							_id: null,
							total: { $sum: 1 },
						},
					},
				],
				options,
			)
			.next();

		return queryResult?.total || 0;
	}

	async countRoomsWithPinnedMessages(options: CollectionAggregationOptions): Promise<number> {
		const queryResult = await this.col
			.aggregate<{ _id: null; total: number }>(
				[
					{ $match: { pinned: true } },
					{ $group: { _id: '$rid' } },
					{
						$group: {
							_id: null,
							total: { $sum: 1 },
						},
					},
				],
				options,
			)
			.next();

		return queryResult?.total || 0;
	}

	async countE2EEMessages(options: WithoutProjection<FindOneOptions<IMessage>>): Promise<number> {
		return this.find({ t: 'e2e' }, options).count();
	}

	findPinned(options: WithoutProjection<FindOneOptions<IMessage>>): Cursor<IMessage> {
		const query: FilterQuery<IMessage> = {
			t: { $ne: 'rm' as MessageTypesValues },
			_hidden: { $ne: true },
			pinned: true,
		};

		return this.find(query, options);
	}

	findStarred(options: WithoutProjection<FindOneOptions<IMessage>>): Cursor<IMessage> {
		const query: FilterQuery<IMessage> = {
			'_hidden': { $ne: true },
			'starred._id': { $exists: true },
		};

		return this.find(query, options);
	}
}
