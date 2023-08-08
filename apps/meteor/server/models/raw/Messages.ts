import type {
	ILivechatDepartment,
	IMessage,
	IRoom,
	IUser,
	MessageTypesValues,
	RocketChatRecordDeleted,
	MessageAttachment,
	IMessageWithPendingFileImport,
} from '@rocket.chat/core-typings';
import type { FindPaginated, IMessagesModel } from '@rocket.chat/model-typings';
import { Rooms } from '@rocket.chat/models';
import type { PaginatedRequest } from '@rocket.chat/rest-typings';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import type {
	AggregationCursor,
	Collection,
	CountDocumentsOptions,
	AggregateOptions,
	FindCursor,
	Db,
	Filter,
	FindOptions,
	IndexDescription,
	InsertOneResult,
	DeleteResult,
	UpdateResult,
	Document,
	UpdateFilter,
} from 'mongodb';

import { otrSystemMessages } from '../../../app/otr/lib/constants';
import { readSecondaryPreferred } from '../../database/readSecondaryPreferred';
import { escapeExternalFederationEventId } from '../../services/federation/infrastructure/rocket-chat/adapters/federation-id-escape-helper';
import { BaseRaw } from './BaseRaw';

type DeepWritable<T> = T extends (...args: any) => any
	? T
	: {
			-readonly [P in keyof T]: DeepWritable<T[P]>;
	  };

export class MessagesRaw extends BaseRaw<IMessage> implements IMessagesModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IMessage>>) {
		super(db, 'message', trash);
	}

	protected modelIndexes(): IndexDescription[] {
		return [
			{ key: { rid: 1, ts: 1, _updatedAt: 1 } },
			{ key: { ts: 1 } },
			{ key: { 'u._id': 1 } },
			{ key: { editedAt: 1 }, sparse: true },
			{ key: { 'editedBy._id': 1 }, sparse: true },
			{ key: { 'rid': 1, 't': 1, 'u._id': 1 } },
			{ key: { expireAt: 1 }, expireAfterSeconds: 0 },
			{ key: { msg: 'text' } },
			{ key: { 'file._id': 1 }, sparse: true },
			{ key: { 'mentions.username': 1 }, sparse: true },
			{ key: { pinned: 1 }, sparse: true },
			{ key: { location: '2dsphere' } },
			{ key: { slackTs: 1, slackBotId: 1 }, sparse: true },
			{ key: { unread: 1 }, sparse: true },
			{ key: { 'pinnedBy._id': 1 }, sparse: true },
			{ key: { 'starred._id': 1 }, sparse: true },

			// discussions
			{ key: { drid: 1 }, sparse: true },

			// threads
			{ key: { tmid: 1 }, sparse: true },
			{ key: { tcount: 1, tlm: 1 }, sparse: true },
			{ key: { rid: 1, tlm: -1 }, partialFilterExpression: { tcount: { $exists: true } } }, // used for the List Threads
			{ key: { rid: 1, tcount: 1 } }, // used for the List Threads Count

			// livechat
			{ key: { 'navigation.token': 1 }, sparse: true },

			{ key: { 'federation.eventId': 1 }, sparse: true },
		];
	}

	findVisibleByMentionAndRoomId(username: IUser['username'], rid: IRoom['_id'], options?: FindOptions<IMessage>): FindCursor<IMessage> {
		const query: Filter<IMessage> = {
			'_hidden': { $ne: true },
			'mentions.username': username,
			rid,
		};

		return this.find(query, options);
	}

	findPaginatedVisibleByMentionAndRoomId(
		username: IUser['username'],
		rid: IRoom['_id'],
		options?: FindOptions<IMessage>,
	): FindPaginated<FindCursor<IMessage>> {
		const query: Filter<IMessage> = {
			'_hidden': { $ne: true },
			'mentions.username': username,
			rid,
		};

		return this.findPaginated(query, options);
	}

	findStarredByUserAtRoom(
		userId: IUser['_id'],
		roomId: IRoom['_id'],
		options?: FindOptions<IMessage>,
	): FindPaginated<FindCursor<IMessage>> {
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

	// TODO: do we need this? currently not used anywhere
	findDiscussionsByRoom(rid: IRoom['_id'], options?: FindOptions<IMessage>): FindCursor<IMessage> {
		const query: Filter<IMessage> = { rid, drid: { $exists: true } };

		return this.find(query, options);
	}

	findDiscussionsByRoomAndText(rid: IRoom['_id'], text: string, options?: FindOptions<IMessage>): FindPaginated<FindCursor<IMessage>> {
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
			return this.col.aggregate(params, { readPreference: readSecondaryPreferred() });
		}
		if (options.offset) {
			params.push({ $skip: options.offset });
		}
		if (options.count) {
			params.push({ $limit: options.count });
		}
		return this.col.aggregate(params, { allowDiskUse: true, readPreference: readSecondaryPreferred() });
	}

	getTotalOfMessagesSentByDate({ start, end, options = {} }: { start: Date; end: Date; options?: PaginatedRequest }): Promise<any[]> {
		const params: Exclude<Parameters<Collection<IMessage>['aggregate']>[0], undefined> = [
			{ $match: { t: { $exists: false }, ts: { $gte: start, $lte: end } } },
			{
				$group: {
					_id: {
						rid: '$rid',
						date: {
							$dateToString: { format: '%Y%m%d', date: '$ts' },
						},
					},
					messages: { $sum: 1 },
				},
			},
			{
				$group: {
					_id: '$_id.rid',
					data: {
						$push: {
							date: '$_id.date',
							messages: '$messages',
						},
					},
				},
			},
			{
				$lookup: {
					from: 'rocketchat_room',
					localField: '_id',
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
				$project: {
					data: '$data',
					room: {
						_id: '$room._id',
						name: {
							$cond: [{ $ifNull: ['$room.fname', false] }, '$room.fname', '$room.name'],
						},
						t: '$room.t',
						usernames: {
							$cond: [{ $ifNull: ['$room.usernames', false] }, '$room.usernames', []],
						},
					},
					type: 'messages',
				},
			},
			{
				$unwind: {
					path: '$data',
				},
			},
			{
				$project: {
					_id: 0,
					date: '$data.date',
					room: 1,
					type: 1,
					messages: '$data.messages',
				},
			},
		];
		if (options.sort) {
			params.push({ $sort: options.sort });
		}
		if (options.count) {
			params.push({ $limit: options.count });
		}
		return this.col.aggregate(params, { allowDiskUse: true, readPreference: readSecondaryPreferred() }).toArray();
	}

	findLivechatClosedMessages(rid: IRoom['_id'], searchTerm?: string, options?: FindOptions<IMessage>): FindPaginated<FindCursor<IMessage>> {
		return this.findPaginated(
			{
				rid,
				$or: [{ t: { $exists: false } }, { t: 'livechat-close' }],
				...(searchTerm && { msg: new RegExp(escapeRegExp(searchTerm), 'ig') }),
			},
			options,
		);
	}

	findLivechatClosingMessage(rid: IRoom['_id'], options?: FindOptions<IMessage>): Promise<IMessage | null> {
		return this.findOne<IMessage>(
			{
				rid,
				t: 'livechat-close',
			},
			options,
		);
	}

	findLivechatMessages(rid: IRoom['_id'], options?: FindOptions<IMessage>): FindCursor<IMessage> {
		return this.find(
			{
				rid,
				$or: [{ t: { $exists: false } }, { t: 'livechat-close' }],
			},
			options,
		);
	}

	findVisibleByRoomIdNotContainingTypesBeforeTs(
		roomId: IRoom['_id'],
		types: IMessage['t'][],
		ts: Date,
		options?: FindOptions<IMessage>,
		showThreadMessages = true,
	): FindCursor<IMessage> {
		const query: Filter<IMessage> = {
			_hidden: {
				$ne: true,
			},
			rid: roomId,
			ts: { $lt: ts },
			...(!showThreadMessages && {
				$or: [
					{
						tmid: { $exists: false },
					},
					{
						tshow: true,
					},
				],
			}),
		};

		if (types.length > 0) {
			query.t = { $nin: types };
		}

		return this.find(query, options);
	}

	findVisibleByRoomIdNotContainingTypesAndUsers(
		roomId: IRoom['_id'],
		types: IMessage['t'][],
		users?: string[],
		options?: FindOptions<IMessage>,
		showThreadMessages = true,
	): FindCursor<IMessage> {
		const query: Filter<IMessage> = {
			_hidden: {
				$ne: true,
			},
			...(Array.isArray(users) && users.length > 0 && { 'u._id': { $nin: users } }),
			rid: roomId,
			...(!showThreadMessages && {
				$or: [
					{
						tmid: { $exists: false },
					},
					{
						tshow: true,
					},
				],
			}),
		};

		if (types.length > 0) {
			query.t = { $nin: types };
		}

		return this.find(query, options);
	}

	findLivechatMessagesWithoutClosing(rid: IRoom['_id'], options?: FindOptions<IMessage>): FindCursor<IMessage> {
		return this.find(
			{
				rid,
				t: { $exists: false },
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

	findPinned(options?: FindOptions<IMessage>): FindCursor<IMessage> {
		const query: Filter<IMessage> = {
			t: { $ne: 'rm' as MessageTypesValues },
			_hidden: { $ne: true },
			pinned: true,
		};

		return this.find(query, options);
	}

	findPaginatedPinnedByRoom(roomId: IMessage['rid'], options?: FindOptions<IMessage>): FindPaginated<FindCursor<IMessage>> {
		const query: Filter<IMessage> = {
			t: { $ne: 'rm' },
			_hidden: { $ne: true },
			pinned: true,
			rid: roomId,
		};

		return this.findPaginated(query, options);
	}

	findStarred(options?: FindOptions<IMessage>): FindCursor<IMessage> {
		const query: Filter<IMessage> = {
			'_hidden': { $ne: true },
			'starred._id': { $exists: true },
		};

		return this.find(query, options);
	}

	async setFederationReactionEventId(username: string, _id: string, reaction: string, federationEventId: string): Promise<void> {
		await this.updateOne(
			{ _id },
			{
				$set: {
					[`reactions.${reaction}.federationReactionEventIds.${escapeExternalFederationEventId(federationEventId)}`]: username,
				} as any,
			},
		);
	}

	async unsetFederationReactionEventId(federationEventId: string, _id: string, reaction: string): Promise<void> {
		await this.updateOne(
			{ _id },
			{
				$unset: {
					[`reactions.${reaction}.federationReactionEventIds.${escapeExternalFederationEventId(federationEventId)}`]: 1,
				},
			},
		);
	}

	async findOneByFederationId(federationEventId: string): Promise<IMessage | null> {
		return this.findOne({ 'federation.eventId': federationEventId });
	}

	async setFederationEventIdById(_id: string, federationEventId: string): Promise<void> {
		await this.updateOne(
			{ _id },
			{
				$set: {
					'federation.eventId': federationEventId,
				},
			},
		);
	}

	async findOneByFederationIdAndUsernameOnReactions(federationEventId: string, username: string): Promise<IMessage | null> {
		return (
			await this.col
				.aggregate(
					[
						{
							$match: {
								t: { $ne: 'rm' },
							},
						},
						{
							$project: {
								document: '$$ROOT',
								reactions: { $objectToArray: '$reactions' },
							},
						},
						{
							$unwind: {
								path: '$reactions',
							},
						},
						{
							$match: {
								$and: [
									{ 'reactions.v.usernames': { $in: [username] } },
									{ [`reactions.v.federationReactionEventIds.${escapeExternalFederationEventId(federationEventId)}`]: username },
								],
							},
						},
						{ $replaceRoot: { newRoot: '$document' } },
					],
					{ readPreference: readSecondaryPreferred() },
				)
				.toArray()
		)[0] as IMessage;
	}

	removeByRoomId(roomId: string): Promise<DeleteResult> {
		return this.deleteMany({ rid: roomId });
	}

	setReactions(messageId: string, reactions: IMessage['reactions']): Promise<UpdateResult> {
		return this.updateOne({ _id: messageId }, { $set: { reactions } });
	}

	keepHistoryForToken(token: string): Promise<UpdateResult | Document> {
		return this.updateMany(
			{
				'navigation.token': token,
				'expireAt': {
					$exists: true,
				},
			},
			{
				$unset: {
					expireAt: 1,
				},
			},
		);
	}

	setRoomIdByToken(token: string, rid: string): Promise<UpdateResult | Document> {
		return this.updateMany(
			{
				'navigation.token': token,
				// @ts-expect-error - mongo allows it, but types don't :(
				'rid': null,
			},
			{
				$set: {
					rid,
				},
			},
		);
	}

	unsetReactions(messageId: string): Promise<UpdateResult> {
		return this.updateOne({ _id: messageId }, { $unset: { reactions: 1 } });
	}

	deleteOldOTRMessages(roomId: string, ts: Date): Promise<DeleteResult> {
		const query: Filter<IMessage> = {
			rid: roomId,
			t: {
				$in: [
					'otr',
					otrSystemMessages.USER_JOINED_OTR,
					otrSystemMessages.USER_REQUESTED_OTR_KEY_REFRESH,
					otrSystemMessages.USER_KEY_REFRESHED_SUCCESSFULLY,
				],
			},
			ts: { $lte: ts },
		};
		return this.deleteMany(query);
	}

	addTranslations(messageId: string, translations: Record<string, string>, providerName: string): Promise<UpdateResult> {
		const updateObj: DeepWritable<UpdateFilter<IMessage>['$set']> = { translationProvider: providerName };
		Object.keys(translations).forEach((key) => {
			const translation = translations[key];
			updateObj[`translations.${key}`] = translation;
		});
		return this.updateOne({ _id: messageId }, { $set: updateObj });
	}

	addAttachmentTranslations(messageId: string, attachmentIndex: string, translations: Record<string, string>): Promise<UpdateResult> {
		const updateObj: DeepWritable<UpdateFilter<IMessage>['$set']> = {};
		Object.keys(translations).forEach((key) => {
			const translation = translations[key];
			updateObj[`attachments.${attachmentIndex}.translations.${key}`] = translation;
		});
		return this.updateOne({ _id: messageId }, { $set: updateObj });
	}

	setImportFileRocketChatAttachment(
		importFileId: string,
		rocketChatUrl: string,
		attachment: MessageAttachment,
	): Promise<UpdateResult | Document> {
		const query = {
			'_importFile.id': importFileId,
		};

		return this.updateMany(query, {
			$set: {
				'_importFile.rocketChatUrl': rocketChatUrl,
				'_importFile.downloaded': true,
			},
			$addToSet: {
				attachments: attachment,
			},
		});
	}

	countVisibleByRoomIdBetweenTimestampsInclusive(roomId: string, afterTimestamp: Date, beforeTimestamp: Date): Promise<number> {
		const query = {
			_hidden: {
				$ne: true,
			},
			rid: roomId,
			ts: {
				$gte: afterTimestamp,
				$lte: beforeTimestamp,
			},
		};

		return this.col.countDocuments(query);
	}

	// FIND
	findByMention(username: string, options?: FindOptions<IMessage>): FindCursor<IMessage> {
		const query = { 'mentions.username': username };

		return this.find(query, options);
	}

	findFilesByUserId(userId: string, options: FindOptions<IMessage> = {}): FindCursor<Pick<IMessage, 'file'>> {
		const query = {
			'u._id': userId,
			'file._id': { $exists: true },
		};
		return this.find(query, { projection: { 'file._id': 1 }, ...options });
	}

	findFilesByRoomIdPinnedTimestampAndUsers(
		rid: string,
		excludePinned: boolean,
		ignoreDiscussion = true,
		ts: Filter<IMessage>['ts'],
		users: string[] = [],
		ignoreThreads = true,
		options: FindOptions<IMessage> = {},
	): FindCursor<IMessage> {
		const query: Filter<IMessage> = {
			rid,
			ts,
			'file._id': { $exists: true },
			...(excludePinned ? { pinned: { $ne: true } } : {}),
			...(ignoreThreads ? { tmid: { $exists: false }, tcount: { $exists: false } } : {}),
			...(ignoreDiscussion ? { drid: { $exists: false } } : {}),
			...(users.length ? { 'u.username': { $in: users } } : {}),
		};

		return this.find(query, { projection: { 'file._id': 1 }, ...options });
	}

	findDiscussionByRoomIdPinnedTimestampAndUsers(
		rid: string,
		excludePinned: boolean,
		ts: Filter<IMessage>['ts'],
		users: string[] = [],
		options: FindOptions<IMessage> = {},
	): FindCursor<IMessage> {
		const query: Filter<IMessage> = {
			rid,
			ts,
			drid: { $exists: true },
			...(excludePinned ? { pinned: { $ne: true } } : {}),
			...(users.length ? { 'u.username': { $in: users } } : {}),
		};

		return this.find(query, options);
	}

	findVisibleByRoomId<T extends IMessage = IMessage>(rid: string, options?: FindOptions<T>): FindCursor<T> {
		const query = {
			_hidden: {
				$ne: true,
			},

			rid,
		};

		return this.find(query, options);
	}

	findVisibleByIds(ids: string[], options?: FindOptions<IMessage>): FindCursor<IMessage> {
		const query = {
			_id: { $in: ids },
			_hidden: {
				$ne: true,
			},
		};

		return this.find(query, options);
	}

	findVisibleThreadByThreadId(tmid: string, options?: FindOptions<IMessage>): FindCursor<IMessage> {
		const query = {
			_hidden: {
				$ne: true,
			},

			tmid,
		};

		return this.find(query, options);
	}

	findVisibleByRoomIdNotContainingTypes(
		roomId: string,
		types: MessageTypesValues[],
		options?: FindOptions<IMessage>,
		showThreadMessages = true,
	): FindCursor<IMessage> {
		const query: Filter<IMessage> = {
			_hidden: {
				$ne: true,
			},
			rid: roomId,
			...(!showThreadMessages && {
				$or: [
					{
						tmid: { $exists: false },
					},
					{
						tshow: true,
					},
				],
			}),
			...(Array.isArray(types) &&
				types.length > 0 && {
					t: { $nin: types },
				}),
		};

		return this.find(query, options);
	}

	findVisibleByRoomIdAfterTimestamp(roomId: string, timestamp: Date, options?: FindOptions<IMessage>): FindCursor<IMessage> {
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

	findForUpdates(roomId: string, timestamp: Date, options?: FindOptions<IMessage>): FindCursor<IMessage> {
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

	findVisibleByRoomIdBeforeTimestamp(roomId: string, timestamp: Date, options?: FindOptions<IMessage>): FindCursor<IMessage> {
		const query = {
			_hidden: {
				$ne: true,
			},
			rid: roomId,
			ts: {
				$lt: timestamp,
			},
		};

		return this.find(query, options);
	}

	findVisibleByRoomIdBeforeTimestampNotContainingTypes(
		roomId: string,
		timestamp: Date,
		types: MessageTypesValues[],
		options?: FindOptions<IMessage>,
		showThreadMessages = true,
		inclusive = false,
	): FindCursor<IMessage> {
		const query = {
			_hidden: {
				$ne: true,
			},
			rid: roomId,
			ts: {
				[inclusive ? '$lte' : '$lt']: timestamp,
			},
			...(!showThreadMessages && {
				$or: [
					{
						tmid: { $exists: false },
					},
					{
						tshow: true,
					},
				],
			}),
			...(Array.isArray(types) &&
				types.length > 0 && {
					t: { $nin: types },
				}),
		};

		return this.find(query, options);
	}

	findVisibleByRoomIdBetweenTimestampsNotContainingTypes(
		roomId: string,
		afterTimestamp: Date,
		beforeTimestamp: Date,
		types: MessageTypesValues[],
		options: FindOptions<IMessage> = {},
		showThreadMessages = true,
		inclusive = false,
	): FindCursor<IMessage> {
		const query = {
			_hidden: {
				$ne: true,
			},
			rid: roomId,
			ts: {
				[inclusive ? '$gte' : '$gt']: afterTimestamp,
				[inclusive ? '$lte' : '$lt']: beforeTimestamp,
			},
			...(!showThreadMessages && {
				$or: [
					{
						tmid: { $exists: false },
					},
					{
						tshow: true,
					},
				],
			}),
			...(Array.isArray(types) &&
				types.length > 0 && {
					t: { $nin: types },
				}),
		};

		return this.find(query, options);
	}

	countVisibleByRoomIdBetweenTimestampsNotContainingTypes(
		roomId: string,
		afterTimestamp: Date,
		beforeTimestamp: Date,
		types: MessageTypesValues[],
		showThreadMessages = true,
		inclusive = false,
	): Promise<number> {
		const query = {
			_hidden: {
				$ne: true,
			},
			rid: roomId,
			ts: {
				[inclusive ? '$gte' : '$gt']: afterTimestamp,
				[inclusive ? '$lte' : '$lt']: beforeTimestamp,
			},
			...(!showThreadMessages && {
				$or: [
					{
						tmid: { $exists: false },
					},
					{
						tshow: true,
					},
				],
			}),
			...(Array.isArray(types) &&
				types.length > 0 && {
					t: { $nin: types },
				}),
		};

		return this.col.countDocuments(query);
	}

	async getLastTimestamp(options: FindOptions<IMessage> = { projection: { _id: 0, ts: 1 } }): Promise<Date | undefined> {
		options.sort = { ts: -1 };
		options.limit = 1;
		const [message] = await this.find({}, options).toArray();
		return message?.ts;
	}

	findByRoomIdAndMessageIds(rid: string, messageIds: string[], options?: FindOptions<IMessage>): FindCursor<IMessage> {
		const query = {
			rid,
			_id: {
				$in: messageIds,
			},
		};

		return this.find(query, options);
	}

	findOneBySlackBotIdAndSlackTs(slackBotId: string, slackTs: Date): Promise<IMessage | null> {
		const query = {
			slackBotId,
			slackTs,
		};

		return this.findOne(query);
	}

	findOneBySlackTs(slackTs: Date): Promise<IMessage | null> {
		const query = { slackTs };

		return this.findOne(query);
	}

	findOneByRoomIdAndMessageId(rid: string, messageId: string, options?: FindOptions<IMessage>): Promise<IMessage | null> {
		const query = {
			rid,
			_id: messageId,
		};

		return this.findOne(query, options);
	}

	getLastVisibleMessageSentWithNoTypeByRoomId(rid: string, messageId?: string): Promise<IMessage | null> {
		const query = {
			rid,
			_hidden: { $ne: true },
			t: { $exists: false },
			$or: [{ tmid: { $exists: false } }, { tshow: true }],
			...(messageId && { _id: { $ne: messageId } }),
		};

		const options: FindOptions<IMessage> = {
			sort: {
				ts: -1,
			},
		};

		return this.findOne(query, options);
	}

	async cloneAndSaveAsHistoryByRecord(record: IMessage, user: IMessage['u']): Promise<InsertOneResult<IMessage>> {
		const { _id: _, ...nRecord } = record;
		return this.insertOne({
			...nRecord,
			_hidden: true,
			// @ts-expect-error - mongo allows it, but types don't :(
			parent: record._id,
			editedAt: new Date(),
			editedBy: {
				_id: user._id,
				username: user.username,
			},
		});
	}

	async cloneAndSaveAsHistoryById(_id: string, user: IMessage['u']): Promise<InsertOneResult<IMessage>> {
		const record = await this.findOneById(_id);
		if (!record) {
			throw new Error('Record not found');
		}

		return this.cloneAndSaveAsHistoryByRecord(record, user);
	}

	// UPDATE
	setHiddenById(_id: string, hidden: boolean): Promise<UpdateResult> {
		if (hidden == null) {
			hidden = true;
		}
		const query = { _id };

		const update: UpdateFilter<IMessage> = {
			$set: {
				_hidden: hidden,
			},
		};

		return this.updateOne(query, update);
	}

	setHiddenByIds(ids: string[], hidden: boolean): Promise<Document | UpdateResult> {
		if (hidden == null) {
			hidden = true;
		}
		const query = { _id: { $in: ids } };

		const update: UpdateFilter<IMessage> = {
			$set: {
				_hidden: hidden,
			},
		};

		return this.updateMany(query, update);
	}

	setAsDeletedByIdAndUser(_id: string, user: IMessage['u']): Promise<UpdateResult> {
		const query = { _id };

		const update: UpdateFilter<IMessage> = {
			$set: {
				msg: '',
				t: 'rm',
				urls: [],
				mentions: [],
				attachments: [],
				reactions: {},
				editedAt: new Date(),
				editedBy: {
					_id: user._id,
					username: user.username,
				},
			},
			$unset: {
				md: 1,
				blocks: 1,
				tshow: 1,
			},
		};

		return this.updateOne(query, update);
	}

	setAsDeletedByIdsAndUser(ids: string[], user: IMessage['u']): Promise<Document | UpdateResult> {
		const query = { _id: { $in: ids } };

		const update: UpdateFilter<IMessage> = {
			$set: {
				msg: '',
				t: 'rm',
				urls: [],
				mentions: [],
				attachments: [],
				reactions: {},
				editedAt: new Date(),
				editedBy: {
					_id: user._id,
					username: user.username,
				},
			},
			$unset: {
				md: 1,
				blocks: 1,
				tshow: 1,
			},
		};

		return this.updateMany(query, update);
	}

	setPinnedByIdAndUserId(
		_id: string,
		pinnedBy: Pick<IUser, '_id' | 'username'> | undefined,
		pinned?: boolean,
		pinnedAt?: Date,
	): Promise<UpdateResult> {
		if (pinned == null) {
			pinned = true;
		}
		if (pinnedAt == null) {
			pinnedAt = undefined;
		}
		const query = { _id };

		const update: UpdateFilter<IMessage> = {
			$set: {
				pinned,
				pinnedAt: pinnedAt || new Date(),
				pinnedBy,
			},
		};

		return this.updateOne(query, update);
	}

	setUrlsById(_id: string, urls: NonNullable<IMessage['urls']>): Promise<UpdateResult> {
		const query = { _id };

		const update: UpdateFilter<IMessage> = {
			$set: {
				urls,
			},
		};

		return this.updateOne(query, update);
	}

	updateAllUsernamesByUserId(userId: string, username: string): Promise<UpdateResult | Document> {
		const query = { 'u._id': userId };

		const update = {
			$set: {
				'u.username': username,
			},
		};

		return this.updateMany(query, update);
	}

	updateUsernameOfEditByUserId(userId: string, username: string): Promise<UpdateResult | Document> {
		const query = { 'editedBy._id': userId };

		const update = {
			$set: {
				'editedBy.username': username,
			},
		};

		return this.updateMany(query, update);
	}

	updateUsernameAndMessageOfMentionByIdAndOldUsername(
		_id: string,
		oldUsername: string,
		newUsername: string,
		newMessage: string,
	): Promise<UpdateResult> {
		const query = {
			_id,
			'mentions.username': oldUsername,
		};

		const update: UpdateFilter<IMessage> = {
			$set: {
				'mentions.$.username': newUsername,
				'msg': newMessage,
			},
		};

		return this.updateOne(query, update);
	}

	updateUserStarById(_id: string, userId: string, starred?: boolean): Promise<UpdateResult> {
		let update: UpdateFilter<IMessage>;
		const query = { _id };

		if (starred) {
			update = {
				$addToSet: {
					starred: { _id: userId },
				},
			};
		} else {
			update = {
				$pull: {
					starred: { _id: userId },
				},
			};
		}

		return this.updateOne(query, update);
	}

	setMessageAttachments(_id: string, attachments: IMessage['attachments']): Promise<UpdateResult> {
		const query = { _id };

		const update: UpdateFilter<IMessage> = {
			$set: {
				attachments,
			},
		};

		return this.updateOne(query, update);
	}

	setSlackBotIdAndSlackTs(_id: string, slackBotId: string, slackTs: Date): Promise<UpdateResult> {
		const query = { _id };

		const update: UpdateFilter<IMessage> = {
			$set: {
				slackBotId,
				slackTs,
			},
		};

		return this.updateOne(query, update);
	}

	unlinkUserId(userId: string, newUserId: string, newUsername: string, newNameAlias: string): Promise<UpdateResult | Document> {
		const query = {
			'u._id': userId,
		};

		const update = {
			$set: {
				'alias': newNameAlias,
				'u._id': newUserId,
				'u.username': newUsername,
				'u.name': undefined,
			},
		};

		return this.updateMany(query, update);
	}

	// INSERT

	async createWithTypeRoomIdMessageUserAndUnread(
		type: MessageTypesValues,
		rid: string,
		message: string,
		user: Pick<IMessage['u'], '_id' | 'username' | 'name'>,
		unread?: boolean,
		extraData?: Partial<IMessage>,
	): Promise<InsertOneResult<IMessage>> {
		const record: Omit<IMessage, '_id' | '_updatedAt'> = {
			t: type,
			rid,
			ts: new Date(),
			msg: message,
			u: {
				_id: user._id,
				username: user.username,
				name: user.name,
			},
			groupable: false as const,
			...(unread && { unread: true }),
		};

		const data = Object.assign(record, extraData);

		await Rooms.incMsgCountById(rid, 1);

		return this.insertOne(data);
	}

	// REMOVE

	removeByRoomIds(rids: string[]): Promise<DeleteResult> {
		return this.deleteMany({ rid: { $in: rids } });
	}

	findThreadsByRoomIdPinnedTimestampAndUsers(
		{
			rid,
			pinned,
			ignoreDiscussion = true,
			ts,
			users = [],
		}: { rid: string; pinned: boolean; ignoreDiscussion?: boolean; ts: Filter<IMessage>['ts']; users: string[] },
		options?: FindOptions<IMessage>,
	): FindCursor<IMessage> {
		const query: Filter<IMessage> = {
			rid,
			ts,
			tlm: { $exists: true },
			tcount: { $exists: true },
			...(users.length > 0 && { 'u.username': { $in: users } }),
		};

		if (pinned) {
			query.pinned = { $ne: true };
		}

		if (ignoreDiscussion) {
			query.drid = { $exists: false };
		}

		return this.find(query, options);
	}

	async removeByIdPinnedTimestampLimitAndUsers(
		rid: string,
		pinned: boolean,
		ignoreDiscussion = true,
		ts: Filter<IMessage>['ts'],
		limit: number,
		users: string[] = [],
		ignoreThreads = true,
	): Promise<number> {
		const query: Filter<IMessage> = {
			rid,
			ts,
			...(users.length > 0 && { 'u.username': { $in: users } }),
		};

		if (pinned) {
			query.pinned = { $ne: true };
		}

		if (ignoreDiscussion) {
			query.drid = { $exists: false };
		}

		if (ignoreThreads) {
			query.tmid = { $exists: false };
			query.tcount = { $exists: false };
		}

		if (!limit) {
			const count = (await this.deleteMany(query)).deletedCount;

			if (count) {
				// decrease message count
				await Rooms.decreaseMessageCountById(rid, count);
			}

			return count;
		}

		const messagesToDelete = (
			await this.find(query, {
				projection: {
					_id: 1,
				},
				limit,
			}).toArray()
		).map(({ _id }) => _id);

		const count = (
			await this.deleteMany({
				_id: {
					$in: messagesToDelete,
				},
			})
		).deletedCount;

		if (count) {
			// decrease message count
			await Rooms.decreaseMessageCountById(rid, count);
		}

		return count;
	}

	removeByUserId(userId: string): Promise<DeleteResult> {
		const query = { 'u._id': userId };

		return this.deleteMany(query);
	}

	getMessageByFileId(fileID: string): Promise<IMessage | null> {
		return this.findOne({ 'file._id': fileID });
	}

	getMessageByFileIdAndUsername(fileID: string, userId: string): Promise<IMessage | null> {
		const query = {
			'file._id': fileID,
			'u._id': userId,
		};

		const options = {
			projection: {
				unread: 0,
				mentions: 0,
				channels: 0,
				groupable: 0,
			},
		};

		return this.findOne(query, options);
	}

	setVisibleMessagesAsRead(rid: string, until: Date): Promise<UpdateResult | Document> {
		return this.updateMany(
			{
				rid,
				unread: true,
				ts: { $lt: until },
				$or: [
					{
						tmid: { $exists: false },
					},
					{
						tshow: true,
					},
				],
			},
			{
				$unset: {
					unread: 1,
				},
			},
		);
	}

	setThreadMessagesAsRead(tmid: string, until: Date): Promise<UpdateResult | Document> {
		return this.updateMany(
			{
				tmid,
				unread: true,
				ts: { $lt: until },
			},
			{
				$unset: {
					unread: 1,
				},
			},
		);
	}

	setAsReadById(_id: string): Promise<UpdateResult> {
		return this.updateOne(
			{
				_id,
			},
			{
				$unset: {
					unread: 1,
				},
			},
		);
	}

	findVisibleUnreadMessagesByRoomAndDate(rid: string, after: Date): FindCursor<Pick<IMessage, '_id'>> {
		const query = {
			unread: true,
			rid,
			$or: [
				{
					tmid: { $exists: false },
				},
				{
					tshow: true,
				},
			],
			...(after && { ts: { $gt: after } }),
		};

		return this.find(query, {
			projection: {
				_id: 1,
			},
		});
	}

	findUnreadThreadMessagesByDate(tmid: string, userId: string, after: Date): FindCursor<Pick<IMessage, '_id'>> {
		const query = {
			'u._id': { $ne: userId },
			'unread': true,
			tmid,
			'tshow': { $exists: false },
			...(after && { ts: { $gt: after } }),
		};

		return this.find(query, {
			projection: {
				_id: 1,
			},
		});
	}

	/**
	 * Copy metadata from the discussion to the system message in the parent channel
	 * which links to the discussion.
	 * Since we don't pass this metadata into the model's function, it is not a subject
	 * to race conditions: If multiple updates occur, the current state will be updated
	 * only if the new state of the discussion room is really newer.
	 */
	async refreshDiscussionMetadata(room: Pick<IRoom, '_id' | 'msgs' | 'lm'>): Promise<UpdateResult | Document | false> {
		const { _id: drid, msgs: dcount, lm: dlm } = room;

		const query = {
			drid,
		};

		return this.updateMany(query, {
			$set: {
				dcount,
				dlm,
			},
		});
	}

	// //////////////////////////////////////////////////////////////////
	// threads

	countThreads(): Promise<number> {
		return this.col.countDocuments({ tcount: { $exists: true } });
	}

	updateRepliesByThreadId(tmid: string, replies: string[], ts: Date): Promise<UpdateResult> {
		const query = {
			_id: tmid,
		};

		const update: UpdateFilter<IMessage> = {
			$addToSet: {
				replies: {
					$each: replies,
				},
			},
			$set: {
				tlm: ts,
			},
			$inc: {
				tcount: 1,
			},
		};

		return this.updateOne(query, update);
	}

	async getThreadFollowsByThreadId(tmid: string): Promise<string[] | undefined> {
		const msg = await this.findOneById(tmid, { projection: { replies: 1 } });
		return msg?.replies;
	}

	addThreadFollowerByThreadId(tmid: string, userId: string): Promise<UpdateResult> {
		const query = {
			_id: tmid,
		};

		const update: UpdateFilter<IMessage> = {
			$addToSet: {
				replies: userId,
			},
		};

		return this.updateOne(query, update);
	}

	removeThreadFollowerByThreadId(tmid: string, userId: string): Promise<UpdateResult> {
		const query = {
			_id: tmid,
		};

		const update: UpdateFilter<IMessage> = {
			$pull: {
				replies: userId,
			},
		};

		return this.updateOne(query, update);
	}

	findThreadsByRoomId(rid: string, skip: number, limit: number): FindCursor<IMessage> {
		return this.find({ rid, tcount: { $exists: true } }, { sort: { tlm: -1 }, skip, limit });
	}

	findAgentLastMessageByVisitorLastMessageTs(roomId: string, visitorLastMessageTs: Date): Promise<IMessage | null> {
		const query = {
			rid: roomId,
			ts: { $gt: visitorLastMessageTs },
			token: { $exists: false },
		};

		return this.findOne(query, { sort: { ts: 1 } });
	}

	findAllImportedMessagesWithFilesToDownload(): FindCursor<IMessageWithPendingFileImport> {
		const query = {
			'_importFile.downloadUrl': {
				$exists: true,
			},
			'_importFile.rocketChatUrl': {
				$exists: false,
			},
			'_importFile.downloaded': {
				$ne: true,
			},
			'_importFile.external': {
				$ne: true,
			},
		};

		return this.find<IMessageWithPendingFileImport>(query);
	}

	countAllImportedMessagesWithFilesToDownload(): Promise<number> {
		const query = {
			'_importFile.downloadUrl': {
				$exists: true,
			},
			'_importFile.rocketChatUrl': {
				$exists: false,
			},
			'_importFile.downloaded': {
				$ne: true,
			},
			'_importFile.external': {
				$ne: true,
			},
		};

		return this.col.countDocuments(query);
	}

	decreaseReplyCountById(_id: string, inc = -1): Promise<UpdateResult> {
		const query = { _id };
		const update: UpdateFilter<IMessage> = {
			$inc: {
				tcount: inc,
			},
		};
		return this.updateOne(query, update);
	}
}
