import type { FindCursor, AggregationCursor, Document, FindOptions, UpdateResult, DeleteResult } from 'mongodb';
import type { IDirectMessageRoom, IMessage, IRoom } from '@rocket.chat/core-typings';

import type { FindPaginated, IBaseModel } from './IBaseModel';

export interface IRoomsModel extends IBaseModel<IRoom> {
	findOneByRoomIdAndUserId(rid: any, uid: any, options?: any): any;

	findManyByRoomIds(roomIds: any, options?: any): any;

	findPaginatedByIds(roomIds: any, options?: any): any;

	getMostRecentAverageChatDurationTime(numberMostRecentChats: any, department: any): Promise<any>;

	findByNameOrFnameContainingAndTypes(
		name: any,
		types: any,
		discussion?: boolean,
		teams?: boolean,
		showOnlyTeams?: boolean,
		options?: any,
	): any;

	findByTypes(types: any, discussion?: boolean, teams?: boolean, onlyTeams?: boolean, options?: any): any;

	findByNameOrFnameContaining(name: any, discussion?: boolean, teams?: boolean, onlyTeams?: boolean, options?: any): any;

	findByTeamId(teamId: any, options?: any): any;

	findPaginatedByTeamIdContainingNameAndDefault(teamId: any, name: any, teamDefault: any, ids: any, options?: any): any;

	findByTeamIdAndRoomsId(teamId: any, rids: any, options?: any): any;

	findRoomsByNameOrFnameStarting(name: any, options: any): any;

	findRoomsWithoutDiscussionsByRoomIds(name: any, roomIds: any, options: any): any;

	findPaginatedRoomsWithoutDiscussionsByRoomIds(name: any, roomIds: any, options: any): any;

	findChannelAndGroupListWithoutTeamsByNameStartingByOwner(uid: any, name: any, groupsToAccept: any, options: any): any;

	unsetTeamId(teamId: any, options?: any): any;

	unsetTeamById(rid: any, options?: any): any;

	setTeamById(rid: any, teamId: any, teamDefault: any, options?: any): any;

	setTeamMainById(rid: any, teamId: any, options?: any): any;

	setTeamByIds(rids: any, teamId: any, options?: any): any;

	setTeamDefaultById(rid: any, teamDefault: any, options?: any): any;

	findChannelsWithNumberOfMessagesBetweenDate(params: {
		start: any;
		end: any;
		startOfLastWeek: any;
		endOfLastWeek: any;
		onlyCount?: boolean;
		options?: any;
	}): any;

	findOneByName(name: any, options?: any): any;

	findDefaultRoomsForTeam(teamId: any): FindCursor<IRoom>;

	incUsersCountByIds(ids: any, inc: number): any;

	findOneByNameOrFname(name: any, options?: any): any;

	allRoomSourcesCount(): AggregationCursor<Document>; // TODO change back when convert model do TS AggregationCursor<{ _id: Required<IOmnichannelGenericRoom['source']>; count: number }>;

	findByBroadcast(options?: any): any;

	findByActiveLivestream(options?: any): any;

	setAsFederated(roomId: any): any;

	setRoomTypeById(roomId: any, roomType: any): any;

	setRoomNameById(roomId: any, name: any): any;

	setFnameById(roomId: any, fname: any): any;

	setRoomTopicById(roomId: any, topic: any): any;

	findByE2E(options: any): any;

	findRoomsInsideTeams(autoJoin?: boolean): any;

	findOneDirectRoomContainingAllUserIDs(uids: string[], options?: FindOptions<IRoom>): Promise<IRoom | null>;

	countByType(t: IRoom['t']): Promise<number>;

	findPaginatedByNameOrFNameAndRoomIdsIncludingTeamRooms(
		searchTerm: RegExp | null,
		teamIds: string[],
		roomIds: string[],
		options?: FindOptions<IRoom>,
	): FindPaginated<FindCursor<IRoom>>;

	findPaginatedContainingNameOrFNameInIdsAsTeamMain(
		searchTerm: RegExp | null,
		rids: string[],
		options?: FindOptions<IRoom>,
	): FindPaginated<FindCursor<IRoom>>;

	findPaginatedByTypeAndIds(type: IRoom['t'], ids: string[], options?: FindOptions<IRoom>): FindPaginated<FindCursor<IRoom>>;

	findFederatedRooms(options?: FindOptions<IRoom>): FindCursor<IRoom>;
	findCountOfRoomsWithActiveCalls(): Promise<number>;
	incMsgCountById(rid: string, inc: number): Promise<UpdateResult>;
	decreaseMessageCountById(rid: string, dec: number): Promise<UpdateResult>;
	findOneByIdOrName(_idOrName: string, options?: FindOptions<IRoom>): Promise<IRoom | null>;
	setCallStatus(_id: string, callStatus: string): Promise<UpdateResult>;
	setCallStatusAndCallStartTime(_id: string, callStatus: string): Promise<UpdateResult>;
	setReactionsInLastMessage(roomId: string, reactions: NonNullable<IRoom['lastMessage']>['reactions']): Promise<UpdateResult>;
	unsetReactionsInLastMessage(roomId: string): Promise<UpdateResult>;
	unsetAllImportIds(): Promise<UpdateResult>;
	updateLastMessageStar(roomId: string, userId: string, starred?: boolean): Promise<UpdateResult>;
	// TODO check types
	setLastMessagePinned(roomId: string, pinnedBy: unknown, pinned?: boolean, pinnedAt?: Date): Promise<UpdateResult>;
	setLastMessageAsRead(roomId: string): Promise<UpdateResult>;
	setDescriptionById(roomId: string, description: string): Promise<UpdateResult>;
	setStreamingOptionsById(roomId: string, streamingOptions: IRoom['streamingOptions']): Promise<UpdateResult>;
	setReadOnlyById(roomId: string, readOnly: boolean): Promise<UpdateResult>;
	setDmReadOnlyByUserId(
		roomId: string,
		ids: string[] | undefined,
		readOnly: boolean,
		reactWhenReadOnly: boolean,
	): Promise<UpdateResult | Document>;
	getDirectConversationsByUserId(userId: string, options?: FindOptions<IRoom>): FindCursor<IRoom>;
	setAllowReactingWhenReadOnlyById(roomId: string, allowReactingWhenReadOnly: boolean): Promise<UpdateResult>;
	setAvatarData(roomId: string, origin: string, etag: string): Promise<UpdateResult>;
	unsetAvatarData(roomId: string): Promise<UpdateResult>;
	setSystemMessagesById(roomId: string, systemMessages: IRoom['sysMes']): Promise<UpdateResult>;
	setE2eKeyId(roomId: string, e2eKeyId: string, options?: FindOptions<IRoom>): Promise<UpdateResult>;
	findOneByImportId(importId: string, options?: FindOptions<IRoom>): Promise<IRoom | null>;
	findOneByNameAndNotId(name: string, rid: string): Promise<IRoom | null>;
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
	findByNameAndType(name: string, type: IRoom['t'], options?: FindOptions<IRoom>): FindCursor<IRoom>;

	findByNameAndTypeNotDefault(
		name: string,
		type: IRoom['t'],
		options?: FindOptions<IRoom>,
		includeFederatedRooms?: boolean,
	): FindCursor<IRoom>;
	findByNameAndTypesNotInIds(
		name: string,
		types: IRoom['t'][],
		ids: string[],
		options?: FindOptions<IRoom>,
		includeFederatedRooms?: boolean,
	): FindCursor<IRoom>;
	findByDefaultAndTypes(defaultValue: boolean, types: IRoom['t'][], options?: FindOptions<IRoom>): FindCursor<IRoom>;
	findDirectRoomContainingAllUsernames(usernames: string[], options?: FindOptions<IRoom>): FindCursor<IRoom>;
	findByTypeAndName(type: IRoom['t'], name: string, options?: FindOptions<IRoom>): Promise<IRoom | null>;
	findByTypeAndNameOrId(type: IRoom['t'], name: string, options?: FindOptions<IRoom>): Promise<IRoom | null>;
	findByTypeAndNameContaining(type: IRoom['t'], name: string, options?: FindOptions<IRoom>): FindCursor<IRoom>;
	findByTypeInIdsAndNameContaining(type: IRoom['t'], ids: string[], name: string, options?: FindOptions<IRoom>): FindCursor<IRoom>;
	findGroupDMsByUids(uids: string[], options?: FindOptions<IDirectMessageRoom>): FindCursor<IDirectMessageRoom>;
	find1On1ByUserId(userId: string, options?: FindOptions<IRoom>): FindCursor<IRoom>;
	findByCreatedOTR(): FindCursor<IRoom>;
	addImportIds(rid: string, importIds: string[]): Promise<UpdateResult>;
	archiveById(rid: string): Promise<UpdateResult>;
	unarchiveById(rid: string): Promise<UpdateResult>;
	setNameById(rid: string, name: string, fname: string): Promise<UpdateResult>;
	incMsgCountAndSetLastMessageById(rid: string, inc: number, lastMessageTs: Date, lastMessage: IRoom['lastMessage']): Promise<UpdateResult>;
	incUsersCountById(rid: string, inc: number): Promise<UpdateResult>;
	incUsersCountNotDMsByIds(rids: string[], inc: number): Promise<UpdateResult>;
	setLastMessageById(rid: string, lastMessage: IRoom['lastMessage']): Promise<UpdateResult>;
	resetLastMessageById(rid: string, lastMessage?: IMessage | null): Promise<UpdateResult>;
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
	unmuteUsernameByRoomId(rid: string, username: string): Promise<UpdateResult>;
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
}
