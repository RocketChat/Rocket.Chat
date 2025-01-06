import type {
	IMessage,
	IRoom,
	IUser,
	ILivechatDepartment,
	MessageTypesValues,
	MessageAttachment,
	IMessageWithPendingFileImport,
} from '@rocket.chat/core-typings';
import type {
	AggregationCursor,
	CountDocumentsOptions,
	FindCursor,
	FindOptions,
	AggregateOptions,
	InsertOneResult,
	DeleteResult,
	UpdateResult,
	Document,
	Filter,
	WithId,
} from 'mongodb';

import type { FindPaginated, IBaseModel } from './IBaseModel';

type PaginatedRequest<S extends string = string> = {
	count?: number;
	offset?: number;
	sort?: `{ "${S}": ${1 | -1} }` | string;
	/* deprecated */
	query?: string;
};
export interface IMessagesModel extends IBaseModel<IMessage> {
	findPaginatedVisibleByMentionAndRoomId(
		username: IUser['username'],
		rid: IRoom['_id'],
		options?: FindOptions<IMessage>,
	): FindPaginated<FindCursor<IMessage>>;

	findVisibleByMentionAndRoomId(username: IUser['username'], rid: IRoom['_id'], options?: FindOptions<IMessage>): FindCursor<IMessage>;

	findStarredByUserAtRoom(userId: IUser['_id'], roomId: IRoom['_id'], options?: FindOptions<IMessage>): FindPaginated<FindCursor<IMessage>>;

	findPaginatedByRoomIdAndType(
		roomId: IRoom['_id'],
		type: IMessage['t'],
		options?: FindOptions<IMessage>,
	): FindPaginated<FindCursor<IMessage>>;

	findDiscussionsByRoom(rid: IRoom['_id'], options?: FindOptions<IMessage>): FindCursor<IMessage>;

	findDiscussionsByRoomAndText(rid: IRoom['_id'], text: string, options?: FindOptions<IMessage>): FindPaginated<FindCursor<IMessage>>;

	findAllNumberOfTransferredRooms(p: {
		start: Date;
		end: Date;
		departmentId?: ILivechatDepartment['_id'];
		onlyCount: true;
		options?: PaginatedRequest;
	}): AggregationCursor<{ total: number }>;

	findAllNumberOfTransferredRooms(p: {
		start: Date;
		end: Date;
		departmentId?: ILivechatDepartment['_id'];
		onlyCount?: false;
		options?: PaginatedRequest;
	}): AggregationCursor<{ _id: string | null; numberOfTransferredRooms: number }>;

	getTotalOfMessagesSentByDate(params: { start: Date; end: Date; options?: any }): Promise<any[]>;

	findLivechatClosedMessages(rid: IRoom['_id'], searchTerm?: string, options?: FindOptions<IMessage>): FindPaginated<FindCursor<IMessage>>;
	findLivechatMessages(rid: IRoom['_id'], options?: FindOptions<IMessage>): FindCursor<IMessage>;
	findLivechatMessagesWithoutTypes(
		rid: IRoom['_id'],
		ignoredTypes: IMessage['t'][],
		showSystemMessages: boolean,
		options?: FindOptions<IMessage>,
	): FindCursor<IMessage>;
	countRoomsWithStarredMessages(options: AggregateOptions): Promise<number>;

	countRoomsWithPinnedMessages(options: AggregateOptions): Promise<number>;

	findPinned(options?: FindOptions<IMessage>): FindCursor<IMessage>;

	findStarred(options?: FindOptions<IMessage>): FindCursor<IMessage>;

	setBlocksById(_id: string, blocks: Required<IMessage>['blocks']): Promise<void>;

	addBlocksById(_id: string, blocks: Required<IMessage>['blocks']): Promise<void>;

	countRoomsWithMessageType(type: IMessage['t'], options: AggregateOptions): Promise<number>;

	countByType(type: IMessage['t'], options: CountDocumentsOptions): Promise<number>;

	findPaginatedPinnedByRoom(roomId: IMessage['rid'], options?: FindOptions<IMessage>): FindPaginated<FindCursor<IMessage>>;

	setFederationReactionEventId(username: string, _id: string, reaction: string, federationEventId: string): Promise<void>;

	unsetFederationReactionEventId(federationEventId: string, _id: string, reaction: string): Promise<void>;

	findOneByFederationIdAndUsernameOnReactions(federationEventId: string, username: string): Promise<IMessage | null>;

	findOneByFederationId(federationEventId: string): Promise<IMessage | null>;

	setFederationEventIdById(_id: string, federationEventId: string): Promise<void>;

	removeByRoomId(roomId: IRoom['_id']): Promise<DeleteResult>;

	findVisibleByRoomIdNotContainingTypesAndUsers(
		roomId: IRoom['_id'],
		types: IMessage['t'][],
		users?: string[],
		options?: FindOptions<IMessage>,
		showThreadMessages?: boolean,
	): FindCursor<IMessage>;
	findVisibleByRoomIdNotContainingTypesBeforeTs(
		roomId: IRoom['_id'],
		types: IMessage['t'][],
		ts: Date,
		showSystemMessages: boolean,
		options?: FindOptions<IMessage>,
		showThreadMessages?: boolean,
	): FindCursor<IMessage>;

	findLivechatClosingMessage(rid: IRoom['_id'], options?: FindOptions<IMessage>): Promise<IMessage | null>;

	setReactions(messageId: string, reactions: IMessage['reactions']): Promise<UpdateResult>;
	keepHistoryForToken(token: string): Promise<UpdateResult | Document>;
	setRoomIdByToken(token: string, rid: string): Promise<UpdateResult | Document>;
	createWithTypeRoomIdMessageUserAndUnread(
		type: MessageTypesValues,
		rid: string,
		message: string,
		user: Pick<IMessage['u'], '_id' | 'username' | 'name'>,
		unread?: boolean,
		extraData?: Partial<IMessage>,
	): Promise<InsertOneResult<IMessage>>;
	unsetReactions(messageId: string): Promise<UpdateResult>;
	deleteOldOTRMessages(roomId: string, ts: Date): Promise<DeleteResult>;
	addTranslations(messageId: string, translations: Record<string, string>, providerName: string): Promise<UpdateResult>;
	addAttachmentTranslations(messageId: string, attachmentIndex: string, translations: Record<string, string>): Promise<UpdateResult>;
	setImportFileRocketChatAttachment(
		importFileId: string,
		rocketChatUrl: string,
		attachment: MessageAttachment,
	): Promise<UpdateResult | Document>;
	countVisibleByRoomIdBetweenTimestampsInclusive(roomId: string, afterTimestamp: Date, beforeTimestamp: Date): Promise<number>;

	findByMention(username: string, options?: FindOptions<IMessage>): FindCursor<IMessage>;
	findVisibleThreadByThreadId(tmid: string, options?: FindOptions<IMessage>): FindCursor<IMessage>;

	findFilesByUserId(userId: string, options?: FindOptions<IMessage>): FindCursor<Pick<IMessage, 'file'>>;
	findVisibleByIds(ids: string[], options?: FindOptions<IMessage>): FindCursor<IMessage>;
	findVisibleByRoomIdNotContainingTypes(
		roomId: string,
		types: MessageTypesValues[],
		options?: FindOptions<IMessage>,
		showThreadMessages?: boolean,
	): FindCursor<IMessage>;
	findFilesByRoomIdPinnedTimestampAndUsers(
		rid: string,
		excludePinned: boolean,
		ignoreDiscussion: boolean,
		ts: Filter<IMessage>['ts'],
		users: string[],
		ignoreThreads: boolean,
		options?: FindOptions<IMessage>,
	): FindCursor<IMessage>;
	findVisibleByRoomId<T extends IMessage = IMessage>(rid: string, options?: FindOptions<T>): FindCursor<T>;
	findDiscussionByRoomIdPinnedTimestampAndUsers(
		rid: string,
		excludePinned: boolean,
		ts: Filter<IMessage>['ts'],
		users: string[],
		options?: FindOptions<IMessage>,
	): FindCursor<IMessage>;
	findVisibleByRoomIdAfterTimestamp(roomId: string, timestamp: Date, options?: FindOptions<IMessage>): FindCursor<IMessage>;
	findVisibleByRoomIdBeforeTimestampNotContainingTypes(
		roomId: string,
		timestamp: Date,
		types: MessageTypesValues[],
		options?: FindOptions<IMessage>,
		showThreadMessages?: boolean,
		inclusive?: boolean,
	): FindCursor<IMessage>;

	findVisibleByRoomIdBetweenTimestampsNotContainingTypes(
		roomId: string,
		afterTimestamp: Date,
		beforeTimestamp: Date,
		types: MessageTypesValues[],
		options?: FindOptions<IMessage>,
		showThreadMessages?: boolean,
		inclusive?: boolean,
	): FindCursor<IMessage>;
	countVisibleByRoomIdBetweenTimestampsNotContainingTypes(
		roomId: string,
		afterTimestamp: Date,
		beforeTimestamp: Date,
		types: MessageTypesValues[],
		showThreadMessages?: boolean,
		inclusive?: boolean,
	): Promise<number>;
	findVisibleByRoomIdBeforeTimestamp(roomId: string, timestamp: Date, options?: FindOptions<IMessage>): FindCursor<IMessage>;
	getLastTimestamp(options?: FindOptions<IMessage>): Promise<Date | undefined>;
	findOneBySlackBotIdAndSlackTs(slackBotId: string, slackTs: Date): Promise<IMessage | null>;
	findByRoomIdAndMessageIds(rid: string, messageIds: string[], options?: FindOptions<IMessage>): FindCursor<IMessage>;
	findForUpdates(roomId: IMessage['rid'], timestamp: { $lt: Date } | { $gt: Date }, options?: FindOptions<IMessage>): FindCursor<IMessage>;
	updateUsernameOfEditByUserId(userId: string, username: string): Promise<UpdateResult | Document>;
	updateAllUsernamesByUserId(userId: string, username: string): Promise<UpdateResult | Document>;

	setUrlsById(_id: string, urls: NonNullable<IMessage['urls']>): Promise<UpdateResult>;
	getLastVisibleUserMessageSentByRoomId(rid: string, messageId?: string): Promise<IMessage | null>;

	findOneBySlackTs(slackTs: Date): Promise<IMessage | null>;

	cloneAndSaveAsHistoryById(_id: string, user: IMessage['u']): Promise<InsertOneResult<IMessage>>;
	cloneAndSaveAsHistoryByRecord(record: IMessage, user: IMessage['u']): Promise<InsertOneResult<IMessage>>;

	setAsDeletedByIdAndUser(_id: string, user: IMessage['u']): Promise<UpdateResult>;
	setAsDeletedByIdsAndUser(_ids: string[], user: IMessage['u']): Promise<Document | UpdateResult>;
	setHiddenById(_id: string, hidden: boolean): Promise<UpdateResult>;
	setHiddenByIds(_ids: string[], hidden: boolean): Promise<Document | UpdateResult>;
	setPinnedByIdAndUserId(
		_id: string,
		pinnedBy: Pick<IUser, '_id' | 'username'> | undefined,
		pinned?: boolean,
		pinnedAt?: Date,
	): Promise<UpdateResult>;
	findOneByRoomIdAndMessageId(rid: string, messageId: string, options?: FindOptions<IMessage>): Promise<IMessage | null>;

	updateUserStarById(_id: string, userId: string, starred?: boolean): Promise<UpdateResult>;
	updateUsernameAndMessageOfMentionByIdAndOldUsername(
		_id: string,
		oldUsername: string,
		newUsername: string,
		newMessage: string,
	): Promise<UpdateResult>;
	unlinkUserId(userId: string, newUserId: string, newUsername: string, newNameAlias: string): Promise<UpdateResult | Document>;
	setSlackBotIdAndSlackTs(_id: string, slackBotId: string, slackTs: Date): Promise<UpdateResult>;
	setMessageAttachments(_id: string, attachments: IMessage['attachments']): Promise<UpdateResult>;

	removeByRoomIds(rids: string[]): Promise<DeleteResult>;

	findThreadsByRoomIdPinnedTimestampAndUsers(
		data: { rid: string; pinned: boolean; ignoreDiscussion?: boolean; ts: Filter<IMessage>['ts']; users: string[] },
		options?: FindOptions<IMessage>,
	): FindCursor<IMessage>;

	removeByIdPinnedTimestampLimitAndUsers(
		rid: string,
		ignorePinned: boolean,
		ignoreDiscussion: boolean,
		ts: Filter<IMessage>['ts'],
		limit: number,
		users: string[],
		ignoreThreads: boolean,
		selectedMessageIds?: string[],
	): Promise<number>;
	findByIdPinnedTimestampLimitAndUsers(
		rid: string,
		ignorePinned: boolean,
		ignoreDiscussion: boolean,
		ts: Filter<IMessage>['ts'],
		limit: number,
		users: string[],
		ignoreThreads: boolean,
	): Promise<string[]>;
	removeByUserId(userId: string): Promise<DeleteResult>;
	getThreadFollowsByThreadId(tmid: string): Promise<string[] | undefined>;
	setVisibleMessagesAsRead(rid: string, until: Date): Promise<UpdateResult | Document>;
	getMessageByFileIdAndUsername(fileID: string, userId: string): Promise<IMessage | null>;
	getMessageByFileId(fileID: string): Promise<IMessage | null>;
	setThreadMessagesAsRead(tmid: string, until: Date): Promise<UpdateResult | Document>;
	updateRepliesByThreadId(tmid: string, replies: string[], ts: Date): Promise<UpdateResult>;
	refreshDiscussionMetadata(room: Pick<IRoom, '_id' | 'msgs' | 'lm'>): Promise<null | WithId<IMessage>>;
	findUnreadThreadMessagesByDate(
		tmid: string,
		userId: string,
		after: Date,
	): FindCursor<Pick<IMessage, '_id' | 't' | 'pinned' | 'drid' | 'tmid'>>;
	findVisibleUnreadMessagesByRoomAndDate(rid: string, after: Date): FindCursor<Pick<IMessage, '_id' | 't' | 'pinned' | 'drid' | 'tmid'>>;
	setAsReadById(_id: string): Promise<UpdateResult>;
	countThreads(): Promise<number>;
	addThreadFollowerByThreadId(tmid: string, userId: string): Promise<UpdateResult>;
	findAllImportedMessagesWithFilesToDownload(): FindCursor<IMessageWithPendingFileImport>;
	countAllImportedMessagesWithFilesToDownload(): Promise<number>;
	findAgentLastMessageByVisitorLastMessageTs(roomId: string, visitorLastMessageTs: Date): Promise<IMessage | null>;
	removeThreadFollowerByThreadId(tmid: string, userId: string): Promise<UpdateResult>;

	findThreadsByRoomId(rid: string, skip: number, limit: number): FindCursor<IMessage>;
	decreaseReplyCountById(_id: string, inc?: number): Promise<IMessage | null>;
	countPinned(options?: CountDocumentsOptions): Promise<number>;
	countStarred(options?: CountDocumentsOptions): Promise<number>;
}
