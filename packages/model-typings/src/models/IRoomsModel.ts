import type {
	IDirectMessageRoom,
	IMessage,
	IOmnichannelGenericRoom,
	IRoom,
	IRoomFederated,
	IRoomNativeFederated,
	ITeam,
	IUser,
} from '@rocket.chat/core-typings';
import type {
	AggregationCursor,
	DeleteResult,
	Document,
	FindCursor,
	FindOptions,
	UpdateOptions,
	UpdateResult,
	CountDocumentsOptions,
	WithId,
	FindOneAndUpdateOptions,
} from 'mongodb';

import type { Updater } from '../updater';
import type { FindPaginated, IBaseModel } from './IBaseModel';
import type { DocumentWithProjection, FindOptionsWithProjection } from '../types/DocumentWithProjection';

export interface IChannelsWithNumberOfMessagesBetweenDate {
	room: {
		_id: IRoom['_id'];
		name: IRoom['name'];
		ts: IRoom['ts'];
		t: IRoom['t'];
		_updatedAt: IRoom['_updatedAt'];
		usernames?: IDirectMessageRoom['usernames'];
	};
	messages: number;
	lastWeekMessages: number;
	diffFromLastWeek: number;
}

export interface IRoomsModel extends IBaseModel<IRoom> {
	findAllByTypesAndDiscussionAndTeam<T extends Document = IRoom, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		filters?: {
			types?: Array<IRoom['t']>;
			discussions?: boolean;
			teams?: boolean;
		},
		findOptions?: O,
	): FindCursor<DocumentWithProjection<T, O>>;

	isAbacAttributeInUse(key: string, values: string[]): Promise<boolean>;

	findOneByRoomIdAndUserId<T extends Document = IRoom, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		rid: IRoom['_id'],
		uid: IUser['_id'],
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null>;

	findManyByRoomIds<T extends Document = IRoom, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		roomIds: Array<IRoom['_id']>,
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;

	findManyArchivedByRoomIds<T extends Document = IRoom, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		roomIds: Array<IRoom['_id']>,
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;

	findPaginatedByIds(
		roomIds: Array<IRoom['_id']>,
		options?: FindOptions<IRoom>,
	): FindPaginated<FindCursor<IRoom & { isLastOwner?: boolean }>>;

	getMostRecentAverageChatDurationTime(numberMostRecentChats: number, department?: string): Promise<Document>;

	findByNameOrFnameContainingAndTypes<T extends Document = IRoom, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		name: NonNullable<IRoom['name']>,
		types: Array<IRoom['t']>,
		discussion?: boolean,
		teams?: boolean,
		options?: O,
	): FindPaginated<FindCursor<DocumentWithProjection<T, O>>>;

	findPrivateRoomsAndTeamsPaginated<T extends Document = IRoom, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		name: NonNullable<IRoom['name']>,
		options?: O,
	): FindPaginated<FindCursor<DocumentWithProjection<T, O>>>;

	findByTeamId<T extends Document = IRoom, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		teamId: ITeam['_id'],
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;

	countByTeamId(teamId: ITeam['_id']): Promise<number>;

	findPaginatedByTeamIdContainingNameAndDefault<
		T extends Document = IRoom,
		O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>,
	>(
		teamId: ITeam['_id'],
		name: IRoom['name'],
		teamDefault: boolean,
		ids: Array<IRoom['_id']> | undefined,
		options?: O,
	): FindPaginated<FindCursor<DocumentWithProjection<T, O>>>;

	findByTeamIdAndRoomsId<T extends Document = IRoom, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		teamId: ITeam['_id'],
		rids: Array<IRoom['_id']>,
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;

	findRoomsByNameOrFnameStarting<T extends Document = IRoom, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		name: NonNullable<IRoom['name']>,
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;

	findRoomsWithoutDiscussionsByRoomIds<T extends Document = IRoom, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		name: NonNullable<IRoom['name']>,
		roomIds: Array<IRoom['_id']>,
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;

	findPaginatedRoomsWithoutDiscussionsByRoomIds<
		T extends Document = IRoom,
		O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>,
	>(
		name: NonNullable<IRoom['name']>,
		roomIds: Array<IRoom['_id']>,
		options?: O,
	): FindPaginated<FindCursor<DocumentWithProjection<T, O>>>;

	findChannelAndGroupListWithoutTeamsByNameStartingByOwner<
		T extends Document = IRoom,
		O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>,
	>(
		name: IRoom['name'],
		groupsToAccept: Array<IRoom['_id']>,
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;

	unsetTeamId(teamId: ITeam['_id'], options?: UpdateOptions): Promise<Document | UpdateResult>;

	unsetTeamById(rid: IRoom['_id'], options?: UpdateOptions): Promise<UpdateResult>;

	setTeamMainById(rid: IRoom['_id'], teamId: ITeam['_id'], options?: UpdateOptions): Promise<UpdateResult>;

	setTeamByIds(rids: Array<IRoom['_id']>, teamId: ITeam['_id'], options?: UpdateOptions): Promise<Document | UpdateResult>;

	setTeamDefaultById(rid: IRoom['_id'], teamDefault: NonNullable<IRoom['teamDefault']>, options?: UpdateOptions): Promise<UpdateResult>;

	findOneByName(name: NonNullable<IRoom['name']>, options?: FindOptions<IRoom>): Promise<IRoom | null>;

	findDefaultRoomsForTeam(teamId: any): FindCursor<IRoom>;

	incUsersCountByIds(ids: Array<IRoom['_id']>, inc: number, options?: UpdateOptions): Promise<Document | UpdateResult>;

	findOneByNameOrFname<T extends Document = IRoom, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		name: NonNullable<IRoom['name']>,
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null>;

	findOneByJoinCodeAndId<T extends Document = IRoom, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		joinCode: string,
		rid: IRoom['_id'],
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null>;

	findOneByNonValidatedName(name: NonNullable<IRoom['name']>, options?: FindOptions<IRoom>): Promise<IRoom | null>;

	allRoomSourcesCount(): AggregationCursor<{ _id: Required<IOmnichannelGenericRoom['source']>; count: number }>;

	countAbacEnabled(): Promise<number>;

	setAsFederated(roomId: IRoom['_id'], { mrid, origin }: { mrid: string; origin: string }): Promise<UpdateResult>;

	setFnameById(_id: IRoom['_id'], fname: IRoom['fname']): Promise<UpdateResult>;

	findE2ERoomById<T extends Document = IRoom, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		roomId: IRoom['_id'],
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null>;

	countRoomsInsideTeams(autoJoin?: boolean): Promise<number>;

	findOneDirectRoomContainingAllUserIDs<T extends Document = IRoom, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		uid: IDirectMessageRoom['uids'],
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null>;

	countByType(t: IRoom['t']): Promise<number>;

	findPaginatedByNameOrFNameAndRoomIdsIncludingTeamRooms<
		T extends Document = IRoom,
		O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>,
	>(
		searchTerm: RegExp | null,
		teamIds: Array<ITeam['_id']>,
		roomIds: Array<IRoom['_id']>,
		options?: O,
	): FindPaginated<FindCursor<DocumentWithProjection<T, O>>>;

	findPaginatedContainingNameOrFNameInIdsAsTeamMain<
		T extends Document = IRoom,
		O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>,
	>(
		searchTerm: RegExp | null,
		rids: Array<IRoom['_id']>,
		options?: O,
	): FindPaginated<FindCursor<DocumentWithProjection<T, O>>>;

	findPaginatedByTypeAndIds<T extends Document = IRoom, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		type: IRoom['t'],
		ids: Array<IRoom['_id']>,
		options?: O,
	): FindPaginated<FindCursor<DocumentWithProjection<T, O>>>;

	findOneFederatedByMrid<T extends Document = IRoomFederated, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		mrid: string,
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null>;

	findBiggestFederatedRoomInNumberOfUsers(options?: FindOptions<IRoom>): Promise<IRoom | undefined>;

	findSmallestFederatedRoomInNumberOfUsers(options?: FindOptions<IRoom>): Promise<IRoom | undefined>;

	countFederatedRooms(): Promise<number>;
	incMsgCountById(rid: string, inc: number): Promise<UpdateResult>;
	findOneAndIncMsgCountById(
		rid: string,
		inc: number,
		options?: Omit<FindOneAndUpdateOptions, 'returnDocument' | 'includeResultMetadata' | 'upsert'>,
	): Promise<IRoom | null>;
	getIncMsgCountUpdateQuery(inc: number, roomUpdater: Updater<IRoom>): Updater<IRoom>;
	decreaseMessageCountById(rid: string, dec: number): Promise<UpdateResult>;
	findOneByIdOrName<T extends Document = IRoom, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		_idOrName: string,
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null>;
	setReactionsInLastMessage(roomId: string, reactions: NonNullable<IRoom['lastMessage']>['reactions']): Promise<UpdateResult>;
	unsetReactionsInLastMessage(roomId: string): Promise<UpdateResult>;
	unsetAllImportIds(): Promise<Document | UpdateResult>;
	updateLastMessageStar(roomId: string, userId: string, starred?: boolean): Promise<UpdateResult>;
	// TODO check types
	setLastMessagePinned(roomId: string, pinnedBy: unknown, pinned?: boolean, pinnedAt?: Date): Promise<UpdateResult>;
	setLastMessageAsRead(roomId: string): Promise<UpdateResult>;
	setDescriptionById(roomId: string, description: string): Promise<UpdateResult>;
	setReadOnlyById(roomId: string, readOnly: NonNullable<IRoom['ro']>): Promise<UpdateResult>;
	setDmReadOnlyByUserId(
		roomId: string,
		ids: string[] | undefined,
		readOnly: NonNullable<IRoom['ro']>,
		reactWhenReadOnly: NonNullable<IRoom['reactWhenReadOnly']>,
	): Promise<UpdateResult | Document>;
	getDirectConversationsByUserId<T extends Document = IRoom, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		userId: string,
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;
	setAllowReactingWhenReadOnlyById(
		roomId: string,
		allowReactingWhenReadOnly: NonNullable<IRoom['reactWhenReadOnly']>,
	): Promise<UpdateResult>;
	setAvatarData(roomId: string, origin: string, etag: string): Promise<UpdateResult>;
	unsetAvatarData(roomId: string): Promise<UpdateResult>;
	setSystemMessagesById(roomId: string, systemMessages: IRoom['sysMes']): Promise<UpdateResult>;
	setE2eKeyId(
		roomId: string,
		e2eKeyId: string,
		options?: Omit<FindOneAndUpdateOptions, 'returnDocument' | 'includeResultMetadata' | 'upsert'>,
	): Promise<IRoom | null>;
	findOneByImportId<T extends Document = IRoom, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		importId: string,
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null>;
	findOneByNameAndNotId(name: string, rid: string): Promise<IRoom | null>;
	findOneByIdAndType<T extends Document = IRoom, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		roomId: IRoom['_id'],
		type: IRoom['t'],
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null>;
	findOneByDisplayName<T extends Document = IRoom, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		displayName: string,
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null>;
	findOneByNameAndType<T extends Document = IRoom, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		name: string,
		type: IRoom['t'],
		options?: O,
		includeFederatedRooms?: boolean,
	): Promise<DocumentWithProjection<T, O> | null>;
	findById<T extends Document = IRoom, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		rid: string,
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null>;
	findByIds<T extends Document = IRoom, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		rids: string[],
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;
	findByType<T extends Document = IRoom, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		type: IRoom['t'],
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;
	findByTypeInIds<T extends Document = IRoom, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		type: IRoom['t'],
		ids: string[],
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;
	findPrivateRoomsByIdsWithAbacAttributes<
		T extends Document = IRoom,
		O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>,
	>(
		ids: string[],
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;
	findAllPrivateRoomsWithAbacAttributes<T extends Document = IRoom, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;
	findBySubscriptionUserId<T extends Document = IRoom, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		userId: string,
		options?: O,
	): Promise<FindCursor<DocumentWithProjection<T, O>>>;
	findBySubscriptionUserIdUpdatedAfter<T extends Document = IRoom, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		userId: string,
		updatedAfter: Date,
		options?: O,
	): Promise<FindCursor<DocumentWithProjection<T, O>>>;
	findByNameAndTypeNotDefault<T extends Document = IRoom, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		name: IRoom['name'] | RegExp,
		type: IRoom['t'],
		options?: O,
		includeFederatedRooms?: boolean,
	): FindCursor<DocumentWithProjection<T, O>>;
	findByNameOrFNameAndTypesNotInIds<T extends Document = IRoom, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		name: IRoom['name'] | RegExp,
		types: IRoom['t'][],
		ids: string[],
		options?: O,
		includeFederatedRooms?: boolean,
	): FindCursor<DocumentWithProjection<T, O>>;
	findByDefaultAndTypes<T extends Document = IRoom, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		defaultValue: boolean,
		types: IRoom['t'][],
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;
	findDirectRoomContainingAllUsernames<T extends Document = IRoom, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		usernames: string[],
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null>;
	findByTypeAndNameOrId<T extends Document = IRoom, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		type: IRoom['t'],
		name: string,
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null>;
	findByTypeAndNameContaining<T extends Document = IRoom, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		type: IRoom['t'],
		name: string,
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;
	findByTypeInIdsAndNameContaining<T extends Document = IRoom, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		type: IRoom['t'],
		ids: string[],
		name: string,
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;
	findGroupDMsByUids<T extends Document = IDirectMessageRoom, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		uids: string[],
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;
	find1On1ByUserId<T extends Document = IRoom, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		userId: string,
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;
	findByUsernamesOrUids(uids: IRoom['u']['_id'][], usernames: IRoom['u']['username'][]): FindCursor<IRoom>;
	findDMsByUids(uids: IRoom['u']['_id'][]): FindCursor<IRoom>;
	addImportIds(rid: string, importIds: string[]): Promise<UpdateResult>;
	archiveById(rid: string): Promise<UpdateResult>;
	unarchiveById(rid: string): Promise<UpdateResult>;
	setNameById(rid: string, name: string, fname: string): Promise<UpdateResult>;
	setIncMsgCountAndSetLastMessageUpdateQuery(
		inc: number,
		lastMessage: IMessage,
		shouldStoreLastMessage: boolean,
		roomUpdater: Updater<IRoom>,
	): Updater<IRoom>;
	incUsersCountById(rid: string, inc: number): Promise<UpdateResult>;
	incUsersCountNotDMsByIds(rids: string[], inc: number): Promise<Document | UpdateResult>;
	getLastMessageUpdateQuery(lastMessage: IRoom['lastMessage'], roomUpdater: Updater<IRoom>): Updater<IRoom>;
	resetLastMessageById(rid: string, lastMessage: IMessage | null, msgCountDelta?: number): Promise<UpdateResult>;
	replaceUsername(username: string, newUsername: string): Promise<UpdateResult | Document>;
	replaceMutedUsername(username: string, newUsername: string): Promise<UpdateResult | Document>;
	replaceUsernameOfUserByUserId(userId: string, newUsername: string): Promise<UpdateResult | Document>;
	setJoinCodeById(rid: string, joinCode: string): Promise<UpdateResult>;
	setTypeById(rid: string, type: IRoom['t']): Promise<UpdateResult>;
	setTopicById(rid: string, topic?: string): Promise<UpdateResult>;
	setAnnouncementById(
		rid: string,
		announcement: IRoom['announcement'],
		announcementDetails: IRoom['announcementDetails'],
	): Promise<UpdateResult>;
	setCustomFieldsById(rid: string, customFields: Record<string, any>): Promise<UpdateResult>;
	muteUsernameByRoomId(rid: string, username: string): Promise<UpdateResult>;
	muteReadOnlyUsernameByRoomId(rid: string, username: string): Promise<UpdateResult>;
	unmuteMutedUsernameByRoomId(rid: string, username: string): Promise<UpdateResult>;
	unmuteReadOnlyUsernameByRoomId(rid: string, username: string): Promise<UpdateResult>;
	saveFeaturedById(rid: string, featured: boolean): Promise<UpdateResult>;
	saveDefaultById(rid: string, defaultValue: boolean): Promise<UpdateResult>;
	saveFavoriteById(rid: string, favorite: boolean, defaultValue: boolean): Promise<UpdateResult>;
	saveRetentionEnabledById(rid: string, retentionEnabled: boolean): Promise<UpdateResult>;
	saveRetentionMaxAgeById(rid: string, retentionMaxAge: number): Promise<UpdateResult>;
	saveRetentionExcludePinnedById(rid: string, retentionExcludePinned: boolean): Promise<UpdateResult>;
	saveRetentionIgnoreThreadsById(rid: string, retentionIgnoreThreads: boolean): Promise<UpdateResult>;
	saveRetentionFilesOnlyById(rid: string, retentionFilesOnly: boolean): Promise<UpdateResult>;
	saveRetentionOverrideGlobalById(rid: string, retentionOverrideGlobal: boolean): Promise<UpdateResult>;
	saveEncryptedById(rid: string, encrypted: boolean): Promise<UpdateResult>;
	updateGroupDMsRemovingUsernamesByUsername(username: string, userId: string): Promise<UpdateResult | Document>;
	createWithIdTypeAndName(id: string, type: IRoom['t'], name: string, extraData?: Record<string, unknown>): Promise<IRoom>;
	createWithFullRoomData(room: Omit<IRoom, '_id' | '_updatedAt'>): Promise<IRoom>;
	removeById(rid: string): Promise<DeleteResult>;
	removeByIds(rids: string[]): Promise<DeleteResult>;
	removeDirectRoomContainingUsername(username: string): Promise<DeleteResult>;
	countDiscussions(): Promise<number>;
	addUserIdToE2EEQueueByRoomIds(roomIds: IRoom['_id'][], uid: IUser['_id']): Promise<Document | UpdateResult>;
	getSubscribedRoomIdsWithoutE2EKeys(uid: IUser['_id']): Promise<IRoom['_id'][]>;
	removeUsersFromE2EEQueueByRoomId(roomId: IRoom['_id'], uids: IUser['_id'][]): Promise<Document | UpdateResult>;
	removeUserFromE2EEQueue(uid: IUser['_id']): Promise<Document | UpdateResult>;
	findChildrenOfTeam(
		teamId: string,
		teamRoomId: string,
		userId: string,
		filter?: string,
		type?: 'channels' | 'discussions',
		options?: FindOptions<IRoom>,
	): AggregationCursor<{ totalCount: { count: number }[]; paginatedResults: IRoom[] }>;
	resetRoomKeyAndSetE2EEQueueByRoomId(
		roomId: string,
		e2eKeyId: string,
		e2eQueue?: IRoom['usersWaitingForE2EKeys'],
	): Promise<WithId<IRoom> | null>;
	countGroupDMsByUids(uids: NonNullable<IRoom['uids']>): Promise<number>;
	countByBroadcast(options?: CountDocumentsOptions): Promise<number>;
	countByE2E(options?: CountDocumentsOptions): Promise<number>;
	markRolePrioritesCreatedForRoom(rid: IRoom['_id'], version: number): Promise<UpdateResult>;
	hasCreatedRolePrioritiesForRoom(rid: IRoom['_id'], syncVersion: number): Promise<number>;
	countDistinctFederationRoomsExcluding(serverNames?: string[]): Promise<string[]>;
	setAbacAttributesById(rid: IRoom['_id'], attributes: NonNullable<IRoom['abacAttributes']>): Promise<IRoom | null>;
	unsetAbacAttributesById(rid: IRoom['_id']): Promise<UpdateResult>;
	unsetAllAbacAttributes(): Promise<Document | UpdateResult>;
	updateSingleAbacAttributeValuesById(rid: IRoom['_id'], key: string, values: string[]): Promise<UpdateResult>;
	insertAbacAttributeIfNotExistsById(
		rid: IRoom['_id'],
		key: string,
		values: string[],
	): Promise<Pick<IRoom, '_id' | 'abacAttributes'> | null>;
	updateAbacAttributeValuesArrayFilteredById(rid: IRoom['_id'], key: string, values: string[]): Promise<IRoom | null>;
	removeAbacAttributeByRoomIdAndKey(rid: IRoom['_id'], key: string): Promise<UpdateResult>;
	removeUserReferenceFromDMsById(roomId: string, username: string, userId: string): Promise<UpdateResult>;
	findFederatedByIds<T extends Document = IRoomNativeFederated, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		ids: Array<IRoom['_id']>,
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;
}
