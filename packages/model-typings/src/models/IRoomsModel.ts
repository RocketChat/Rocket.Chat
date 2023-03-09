import type { IDirectMessageRoom, IOmnichannelGenericRoom, IRoom, IRoomFederated, ITeam, IUser } from '@rocket.chat/core-typings';
import type { PaginatedRequest } from '@rocket.chat/rest-typings';
import type { AggregationCursor, Document, FindCursor, FindOptions, UpdateOptions, UpdateResult } from 'mongodb';

import type { FindPaginated, IBaseModel } from './IBaseModel';

export interface IRoomsModel extends IBaseModel<IRoom> {
	findOneByRoomIdAndUserId(rid: IRoom['_id'], uid: IUser['_id'], options?: FindOptions<IRoom>): Promise<IRoom | null>;

	findManyByRoomIds(roomIds: Array<IRoom['_id']>, options?: FindOptions<IRoom>): FindCursor<IRoom>;

	findPaginatedByIds(roomIds: Array<IRoom['_id']>, options?: FindOptions<IRoom>): FindPaginated<FindCursor<IRoom>>;

	getMostRecentAverageChatDurationTime(numberMostRecentChats: number, department: string | object): Promise<Document>;

	findByNameOrFnameContainingAndTypes(
		name: NonNullable<IRoom['name']>,
		types: Array<IRoom['t']>,
		discussion: boolean,
		teams: boolean,
		showOnlyTeams: boolean,
		options?: FindOptions<IRoom>,
	): FindPaginated<FindCursor<IRoom>>;

	findByTypes(
		types: Array<IRoom['t']>,
		discussion: boolean,
		teams: boolean,
		onlyTeams: boolean,
		options?: FindOptions<IRoom>,
	): FindPaginated<FindCursor<IRoom>>;

	findByNameOrFnameContaining(
		name: NonNullable<IRoom['name']>,
		discussion: boolean,
		teams: boolean,
		onlyTeams: boolean,
		options?: FindOptions<IRoom>,
	): FindPaginated<FindCursor<IRoom>>;

	findByTeamId(teamId: ITeam['_id'], options?: FindOptions<IRoom>): FindCursor<IRoom>;

	findPaginatedByTeamIdContainingNameAndDefault(
		teamId: ITeam['_id'],
		name: IRoom['name'],
		teamDefault: boolean,
		ids: Array<IRoom['_id']>,
		options?: FindOptions<IRoom>,
	): FindPaginated<FindCursor<IRoom>>;

	findByTeamIdAndRoomsId(teamId: ITeam['_id'], rids: Array<IRoom['_id']>, options?: FindOptions<IRoom>): FindCursor<IRoom>;

	findChannelAndPrivateByNameStarting(
		name: NonNullable<IRoom['name']>,
		sIds: Array<IRoom['_id']>,
		options?: FindOptions<IRoom>,
	): FindCursor<IRoom>;

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

	unsetTeamId(teamId: ITeam['_id'], options: UpdateOptions): Promise<Document | UpdateResult>;

	unsetTeamById(rid: IRoom['_id'], options: UpdateOptions): Promise<UpdateResult>;

	setTeamById(rid: IRoom['_id'], teamId: ITeam['_id'], teamDefault: IRoom['teamDefault'], options: UpdateOptions): Promise<UpdateResult>;

	setTeamMainById(rid: IRoom['_id'], teamId: ITeam['_id'], options: UpdateOptions): Promise<UpdateResult>;

	setTeamByIds(rids: Array<IRoom['_id']>, teamId: ITeam['_id'], options: UpdateOptions): Promise<Document | UpdateResult>;

	setTeamDefaultById(rid: IRoom['_id'], teamDefault: IRoom['teamDefault'], options: UpdateOptions): Promise<UpdateResult>;

	findChannelsWithNumberOfMessagesBetweenDate<T extends boolean>(params: {
		start: number;
		end: number;
		startOfLastWeek: number;
		endOfLastWeek: number;
		onlyCount?: T;
		options?: PaginatedRequest;
	}): T extends true ? { total: number } : AggregationCursor<IRoom>;

	findOneByName(name: IRoom['name'], options?: FindOptions<IRoom>): Promise<IRoom | null>;

	findDefaultRoomsForTeam(teamId: any): FindCursor<IRoom>;

	incUsersCountByIds(ids: Array<IRoom['_id']>, inc: number): Promise<Document | UpdateResult>;

	findOneByNameOrFname(name: NonNullable<IRoom['name'] | IRoom['fname']>, options?: FindOptions<IRoom>): Promise<IRoom | null>;

	allRoomSourcesCount(): AggregationCursor<{ _id: Required<IOmnichannelGenericRoom['source']>; count: number }>;

	findByBroadcast(options?: FindOptions<IRoom>): FindCursor<IRoom>;

	findByActiveLivestream(options?: FindOptions<IRoom>): FindCursor<IRoom>;

	setAsFederated(roomId: IRoom['_id']): Promise<UpdateResult>;

	setRoomTypeById(roomId: IRoom['_id'], roomType: IRoom['t']): Promise<UpdateResult>;

	setRoomNameById(roomId: IRoom['_id'], name: IRoom['name']): Promise<UpdateResult>;

	setFnameById(_id: IRoom['_id'], fname: IRoom['fname']): Promise<UpdateResult>;

	setRoomTopicById(roomId: IRoom['_id'], topic: IRoom['description']): Promise<UpdateResult>;

	findByE2E(options?: FindOptions<IRoom>): FindCursor<IRoom>;

	findRoomsInsideTeams(autoJoin: boolean): FindCursor<IRoom>;

	findOneDirectRoomContainingAllUserIDs(uid: IDirectMessageRoom['uids'], options?: FindOptions<IRoom>): Promise<IDirectMessageRoom | null>;

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

	findCountOfRoomsWithActiveCalls(): Promise<number>;
}
