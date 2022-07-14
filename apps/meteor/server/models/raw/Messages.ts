import type { ILivechatDepartment, IMessage, IRoom, IUser, MessageTypesValues, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { FindPaginated, IMessagesModel } from '@rocket.chat/model-typings';
import type { PaginatedRequest } from '@rocket.chat/rest-typings';
import type { AggregationCursor, Collection, CountDocumentsOptions, AggregateOptions, FindCursor, Db, Filter, FindOptions } from 'mongodb';
import { escapeRegExp } from '@rocket.chat/string-helpers';

import { BaseRaw } from './BaseRaw';

// @ts-ignore Circular reference on field 'attachments'
export class MessagesRaw extends BaseRaw<IMessage> implements IMessagesModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IMessage>>) {
		super(db, 'message', trash);
	}

	findVisibleByMentionAndRoomId(
		username: IUser['username'],
		rid: IRoom['_id'],
		options: FindOptions<IMessage>,
	): FindPaginated<FindCursor<IMessage>> {
		const query: Filter<IMessage> = {
			'_hidden': { $ne: true },
			'mentions.username': username,
			rid,
		};

		return this.findPaginated(query, options);
	}

	findStarredByUserAtRoom(userId: IUser['_id'], roomId: IRoom['_id'], options: FindOptions<IMessage>): FindPaginated<FindCursor<IMessage>> {
		const query: Filter<IMessage> = {
			'_hidden': { $ne: true },
			'starred._id': userId,
			'rid': roomId,
		};

		return this.findPaginated(query, options);
	}

	findPaginatedByRoomIdAndType(
		roomId: IRoom['_id'],
		type: IMessage['t'],
		options: FindOptions<IMessage> = {},
	): FindPaginated<FindCursor<IMessage>> {
		const query = {
			rid: roomId,
			t: type,
		};

		return this.findPaginated(query, options);
	}

	findSnippetedByRoom(roomId: IRoom['_id'], options: FindOptions<IMessage>): FindPaginated<FindCursor<IMessage>> {
		const query: Filter<IMessage> = {
			_hidden: { $ne: true },
			snippeted: true,
			rid: roomId,
		};

		return this.findPaginated(query, options);
	}

	// TODO: do we need this? currently not used anywhere
	findDiscussionsByRoom(rid: IRoom['_id'], options: FindOptions<IMessage>): FindCursor<IMessage> {
		const query: Filter<IMessage> = { rid, drid: { $exists: true } };

		return this.find(query, options);
	}

	findDiscussionsByRoomAndText(rid: IRoom['_id'], text: string, options: FindOptions<IMessage>): FindPaginated<FindCursor<IMessage>> {
		const query: Filter<IMessage> = {
			rid,
			drid: { $exists: true },
			msg: new RegExp(escapeRegExp(text), 'i'),
		};

		return this.findPaginated(query, options);
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

	findLivechatClosedMessages(rid: IRoom['_id'], options: FindOptions<IMessage>): FindPaginated<FindCursor<IMessage>> {
		return this.findPaginated(
			{
				rid,
				$or: [{ t: { $exists: false } }, { t: 'livechat-close' }],
			},
			options,
		);
	}

	async setBlocksById(_id: string, blocks: Required<IMessage>['blocks']): Promise<void> {
		await this.updateOne(
			{ _id },
			{
				$set: {
					blocks,
				},
			},
		);
	}

	async addBlocksById(_id: string, blocks: Required<IMessage>['blocks']): Promise<void> {
		await this.updateOne({ _id }, { $addToSet: { blocks: { $each: blocks } } });
	}

	async removeVideoConfJoinButton(_id: IMessage['_id']): Promise<void> {
		await this.updateOne(
			{ _id },
			{
				$pull: {
					blocks: {
						appId: 'videoconf-core',
						type: 'actions',
					} as Required<IMessage>['blocks'][number],
				},
			},
		);
	}

	async countRoomsWithStarredMessages(options: AggregateOptions): Promise<number> {
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

	async countRoomsWithMessageType(type: IMessage['t'], options: AggregateOptions): Promise<number> {
		const queryResult = await this.col
			.aggregate<{ _id: null; total: number }>(
				[
					{ $match: { t: type } },
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

	async countByType(type: IMessage['t'], options: CountDocumentsOptions): Promise<number> {
		return this.col.countDocuments({ t: type }, options);
	}

	async countRoomsWithPinnedMessages(options: AggregateOptions): Promise<number> {
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

	findPinned(options: FindOptions<IMessage>): FindCursor<IMessage> {
		const query: Filter<IMessage> = {
			t: { $ne: 'rm' as MessageTypesValues },
			_hidden: { $ne: true },
			pinned: true,
		};

		return this.find(query, options);
	}

	findPaginatedPinnedByRoom(roomId: IMessage['rid'], options: FindOptions<IMessage>): FindPaginated<FindCursor<IMessage>> {
		const query: Filter<IMessage> = {
			t: { $ne: 'rm' },
			_hidden: { $ne: true },
			pinned: true,
			rid: roomId,
		};

		return this.findPaginated(query, options);
	}

	findStarred(options: FindOptions<IMessage>): FindCursor<IMessage> {
		const query: Filter<IMessage> = {
			'_hidden': { $ne: true },
			'starred._id': { $exists: true },
		};

		return this.find(query, options);
	}
}
