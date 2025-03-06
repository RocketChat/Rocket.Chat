import type { IDirectMessageRoom, IMessage, IOmnichannelGenericRoom, IRoom, IRoomFederated, ITeam, IUser } from '@rocket.chat/core-typings';
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
} from 'mongodb';

import type { Updater } from '../updater';
import type { FindPaginated, IBaseModel } from './IBaseModel';

export interface IChannelsWithNumberOfMessagesBetweenDate {
	room: {
		_id: IRoom['_id'];
		name: IRoom['name'] | IRoom['fname'];
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
	findOneByRoomIdAndUserId(rid: IRoom['_id'], uid: IUser['_id'], options?: FindOptions<IRoom>): Promise<IRoom | null>;

	findManyByRoomIds(roomIds: Array<IRoom['_id']>, options?: FindOptions<IRoom>): FindCursor<IRoom>;

	findPaginatedByIds(
		roomIds: Array<IRoom['_id']>,
		options?: FindOptions<IRoom>,
	): FindPaginated<FindCursor<IRoom & { isLastOwner?: boolean }>>;

	getMostRecentAverageChatDurationTime(numberMostRecentChats: number, department?: string): Promise<Document>;

	findByNameOrFnameContainingAndTypes(
		name: NonNullable<IRoom['name']>,
		types: Array<IRoom['t']>,
		discussion?: boolean,
		teams?: boolean,
		options?: FindOptions<IRoom>,
	): FindPaginated<FindCursor<IRoom>>;

	findByTeamId(teamId: ITeam['_id'], options?: FindOptions<IRoom>): FindCursor<IRoom>;

	countByTeamId(teamId: ITeam['_id']): Promise<number>;

	findPaginatedByTeamIdContainingNameAndDefault(
		teamId: ITeam['_id'],
		name: IRoom['name'],
		teamDefault: boolean,
		ids: Array<IRoom['_id']> | undefined,
		options?: FindOptions<IRoom>,
	): FindPaginated<FindCursor<IRoom>>;

	findByTeamIdAndRoomsId(teamId: ITeam['_id'], rids: Array<IRoom['_id']>, options?: FindOptions<IRoom>): FindCursor<IRoom>;

	findRoomsByNameOrFnameStarting(name: NonNullable<IRoom['name'] | IRoom['fname']>, options?: FindOptions<IRoom>): FindCursor<IRoom>;

	findRoomsWithoutDiscussionsByRoomIds(
		name: NonNullable<IRoom['name']>,
		roomIds: Array<IRoom['_id']>,
		options?: FindOptions<IRoom>,
	): FindCursor<IRoom>;

	findPaginatedRoomsWithoutDiscussionsByRoomIds(
		name: NonNullable<IRoom['name']>,
		roomIds: Array<IRoom['_id']>,
		options?: FindOptions<IRoom>,
	): FindPaginated<FindCursor<IRoom>>;

	findChannelAndGroupListWithoutTeamsByNameStartingByOwner(
		name: NonNullable<IRoom['name']>,
		groupsToAccept: Array<IRoom['_id']>,
		options?: FindOptions<IRoom>,
	): FindCursor<IRoom>;

	unsetTeamId(teamId: ITeam['_id'], options?: UpdateOptions): Promise<Document | UpdateResult>;

	unsetTeamById(rid: IRoom['_id'], options?: UpdateOptions): Promise<UpdateResult>;

	setTeamById(
		rid: IRoom['_id'],
		teamId: ITeam['_id'],
		teamDefault: NonNullable<IRoom['teamDefault']>,
		options?: UpdateOptions,
	): Promise<UpdateResult>;

	setTeamMainById(rid: IRoom['_id'], teamId: ITeam['_id'], options?: UpdateOptions): Promise<UpdateResult>;

	setTeamByIds(rids: Array<IRoom['_id']>, teamId: ITeam['_id'], options?: UpdateOptions): Promise<Document | UpdateResult>;

	setTeamDefaultById(rid: IRoom['_id'], teamDefault: NonNullable<IRoom['teamDefault']>, options?: UpdateOptions): Promise<UpdateResult>;

	findChannelsByTypesWithNumberOfMessagesBetweenDate(params: {
		types: Array<IRoom['t']>;
		start: number;
		end: number;
		startOfLastWeek: number;
		endOfLastWeek: number;
		options?: any;
	}): AggregationCursor<IChannelsWithNumberOfMessagesBetweenDate>;

	findOneByName(name: NonNullable<IRoom['name']>, options?: FindOptions<IRoom>): Promise<IRoom | null>;

	findDefaultRoomsForTeam(teamId: any): FindCursor<IRoom>;

	incUsersCountByIds(ids: Array<IRoom['_id']>, inc: number, options?: UpdateOptions): Promise<Document | UpdateResult>;

	findOneByNameOrFname(name: NonNullable<IRoom['name'] | IRoom['fname']>, options?: FindOptions<IRoom>): Promise<IRoom | null>;

	findOneByJoinCodeAndId(joinCode: string, rid: IRoom['_id'], options?: FindOptions<IRoom>): Promise<IRoom | null>;

	findOneByNonValidatedName(name: NonNullable<IRoom['name'] | IRoom['fname']>, options?: FindOptions<IRoom>): Promise<IRoom | null>;

	allRoomSourcesCount(): AggregationCursor<{ _id: Required<IOmnichannelGenericRoom['source']>; count: number }>;

	findByBroadcast(options?: FindOptions<IRoom>): FindCursor<IRoom>;

	setAsFederated(roomId: IRoom['_id']): Promise<UpdateResult>;

	setRoomTypeById(roomId: IRoom['_id'], roomType: IRoom['t']): Promise<UpdateResult>;

	setRoomNameById(roomId: IRoom['_id'], name: IRoom['name']): Promise<UpdateResult>;

	setSidepanelById(roomId: IRoom['_id'], sidepanel: IRoom['sidepanel']): Promise<UpdateResult>;

	setFnameById(_id: IRoom['_id'], fname: IRoom['fname']): Promise<UpdateResult>;

	setRoomTopicById(roomId: IRoom['_id'], topic: IRoom['description']): Promise<UpdateResult>;

	findByE2E(options?: FindOptions<IRoom>): FindCursor<IRoom>;

	findE2ERoomById(roomId: IRoom['_id'], options?: FindOptions<IRoom>): Promise<IRoom | null>;

	findRoomsInsideTeams(autoJoin?: boolean): FindCursor<IRoom>;

	countRoomsInsideTeams(autoJoin?: boolean): Promise<number>;

	findOneDirectRoomContainingAllUserIDs(uid: IDirectMessageRoom['uids'], options?: FindOptions<IRoom>): Promise<IRoom | null>;

	countByType(t: IRoom['t']): Promise<number>;

	findPaginatedByNameOrFNameAndRoomIdsIncludingTeamRooms(
		searchTerm: RegExp | null,
		teamIds: Array<ITeam['_id']>,
		roomIds: Array<IRoom['_id']>,
		options?: FindOptions<IRoom>,
	): FindPaginated<FindCursor<IRoom>>;

	findPaginatedContainingNameOrFNameInIdsAsTeamMain(
		searchTerm: RegExp | null,
		rids: Array<IRoom['_id']>,
		options?: FindOptions<IRoom>,
	): FindPaginated<FindCursor<IRoom>>;

	findPaginatedByTypeAndIds(type: IRoom['t'], ids: Array<IRoom['_id']>, options?: FindOptions<IRoom>): FindPaginated<FindCursor<IRoom>>;

	findFederatedRooms(options?: FindOptions<IRoom>): FindCursor<IRoomFederated>;

	findFederatedRooms(options?: FindOptions<IRoom>): FindCursor<IRoom>;

	findCountOfRoomsWithActiveCalls(): Promise<number>;

	findBiggestFederatedRoomInNumberOfUsers(options?: FindOptions<IRoom>): Promise<IRoom | undefined>;

	findSmallestFederatedRoomInNumberOfUsers(options?: FindOptions<IRoom>): Promise<IRoom | undefined>;

	countFederatedRooms(): Promise<number>;
	incMsgCountById(rid: string, inc: number): Promise<UpdateResult>;
	getIncMsgCountUpdateQuery(inc: number, roomUpdater: Updater<IRoom>): Updater<IRoom>;
	decreaseMessageCountById(rid: string, dec: number): Promise<UpdateResult>;
	findOneByIdOrName(_idOrName: string, options?: FindOptions<IRoom>): Promise<IRoom | null>;
	setCallStatus(_id: string, callStatus: IRoom['callStatus']): Promise<UpdateResult>;
	setCallStatusAndCallStartTime(_id: string, callStatus: IRoom['callStatus']): Promise<UpdateResult>;
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
	getDirectConversationsByUserId(userId: string, options?: FindOptions<IRoom>): FindCursor<IRoom>;
	setAllowReactingWhenReadOnlyById(
		roomId: string,
		allowReactingWhenReadOnly: NonNullable<IRoom['reactWhenReadOnly']>,
	): Promise<UpdateResult>;
	setAvatarData(roomId: string, origin: string, etag: string): Promise<UpdateResult>;
	unsetAvatarData(roomId: string): Promise<UpdateResult>;
	setSystemMessagesById(roomId: string, systemMessages: IRoom['sysMes']): Promise<UpdateResult>;
	setE2eKeyId(roomId: string, e2eKeyId: string, options?: FindOptions<IRoom>): Promise<UpdateResult>;
	findOneByImportId(importId: string, options?: FindOptions<IRoom>): Promise<IRoom | null>;
	findOneByNameAndNotId(name: string, rid: string): Promise<IRoom | null>;
	findOneByIdAndType(roomId: IRoom['_id'], type: IRoom['t'], options?: FindOptions<IRoom>): Promise<IRoom | null>;
	findOneByDisplayName(displayName: string, options?: FindOptions<IRoom>): Promise<IRoom | null>;
	findOneByNameAndType(
		name: string,
		type: IRoom['t'],
		options?: FindOptions<IRoom>,
		includeFederatedRooms?: boolean,
	): Promise<IRoom | null>;
	findById(rid: string, options?: FindOptions<IRoom>): Promise<IRoom | null>;
	findByIds(rids: string[], options?: FindOptions<IRoom>): FindCursor<IRoom>;
	findByType(type: IRoom['t'], options?: FindOptions<IRoom>): FindCursor<IRoom>;
	findByTypeInIds(type: IRoom['t'], ids: string[], options?: FindOptions<IRoom>): FindCursor<IRoom>;
	findBySubscriptionUserId(userId: string, options?: FindOptions<IRoom>): Promise<FindCursor<IRoom>>;
	findBySubscriptionUserIdUpdatedAfter(userId: string, updatedAfter: Date, options?: FindOptions<IRoom>): Promise<FindCursor<IRoom>>;
	findByNameAndTypeNotDefault(
		name: IRoom['name'] | RegExp,
		type: IRoom['t'],
		options?: FindOptions<IRoom>,
		includeFederatedRooms?: boolean,
	): FindCursor<IRoom>;
	findByNameOrFNameAndTypesNotInIds(
		name: IRoom['name'] | RegExp,
		types: IRoom['t'][],
		ids: string[],
		options?: FindOptions<IRoom>,
		includeFederatedRooms?: boolean,
	): FindCursor<IRoom>;
	findByDefaultAndTypes(defaultValue: boolean, types: IRoom['t'][], options?: FindOptions<IRoom>): FindCursor<IRoom>;
	findDirectRoomContainingAllUsernames(usernames: string[], options?: FindOptions<IRoom>): Promise<IRoom | null>;
	findByTypeAndName(type: IRoom['t'], name: string, options?: FindOptions<IRoom>): Promise<IRoom | null>;
	findByTypeAndNameOrId(type: IRoom['t'], name: string, options?: FindOptions<IRoom>): Promise<IRoom | null>;
	findByTypeAndNameContaining(type: IRoom['t'], name: string, options?: FindOptions<IRoom>): FindCursor<IRoom>;
	findByTypeInIdsAndNameContaining(type: IRoom['t'], ids: string[], name: string, options?: FindOptions<IRoom>): FindCursor<IRoom>;
	findGroupDMsByUids(uids: string[], options?: FindOptions<IDirectMessageRoom>): FindCursor<IDirectMessageRoom>;
	find1On1ByUserId(userId: string, options?: FindOptions<IRoom>): FindCursor<IRoom>;
	findByCreatedOTR(): FindCursor<IRoom>;
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
	setTopicById(rid: string, topic?: string | undefined): Promise<UpdateResult>;
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
	createWithIdTypeAndName(id: string, type: IRoom['t'], name: string, extraData?: Record<string, string>): Promise<IRoom>;
	createWithFullRoomData(room: Omit<IRoom, '_id' | '_updatedAt'>): Promise<IRoom>;
	removeById(rid: string): Promise<DeleteResult>;
	removeByIds(rids: string[]): Promise<DeleteResult>;
	removeDirectRoomContainingUsername(username: string): Promise<DeleteResult>;
	countDiscussions(): Promise<number>;
	setOTRForDMByRoomID(rid: string): Promise<UpdateResult>;
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
	countByCreatedOTR(options?: CountDocumentsOptions): Promise<number>;
	countByBroadcast(options?: CountDocumentsOptions): Promise<number>;
	countByE2E(options?: CountDocumentsOptions): Promise<number>;
	markRolePrioritesCreatedForRoom(rid: IRoom['_id'], version: number): Promise<UpdateResult>;
	hasCreatedRolePrioritiesForRoom(rid: IRoom['_id'], syncVersion: number): Promise<number>;
}
