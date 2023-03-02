import type { FindCursor, AggregationCursor, Document, FindOptions } from 'mongodb';
import type { IDirectMessageRoom, IRoom, IRoomFederated, ITeam, IUser, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { PaginatedRequest } from '@rocket.chat/rest-typings';
import type {
	AggregationCursor,
	Collection,
	Db,
	Document,
	Filter,
	FindCursor,
	FindOptions,
	UpdateFilter,
	UpdateOptions,
	UpdateResult,
} from 'mongodb';

import type { FindPaginated, IBaseModel } from './IBaseModel';

export interface IRoomsModel extends IBaseModel<IRoom> {
	findOneByRoomIdAndUserId(rid: IRoom['_id'], uid: IUser['_id'], options: FindOptions<IRoom> = {}): Promise<IRoom | null>;

	findManyByRoomIds(roomIds: Array<IRoom['_id']>, options: FindOptions<IRoom> = {}): FindCursor<IRoom>;

	findPaginatedByIds(roomIds: Array<IRoom['_id']>, options: FindOptions<IRoom> = {}): FindPaginated<FindCursor<IRoom>>;

	getMostRecentAverageChatDurationTime(numberMostRecentChats: number, department: string | object): Promise<Document>;

	findByNameContainingAndTypes(
		name: NonNullable<IRoom['name']>,
		types: Array<IRoom['t']>,
		discussion: boolean = false,
		teams: boolean = false,
		showOnlyTeams: boolean = false,
		options: FindOptions<IRoom> = {},
	): FindPaginated<FindCursor<IRoom>>;

	findByTypes(
		types: Array<IRoom['t']>,
		discussion: boolean = false,
		teams: boolean = false,
		onlyTeams: boolean = false,
		options: FindOptions<IRoom> = {},
	): FindPaginated<FindCursor<IRoom>>;

	findByNameContaining(
		name: NonNullable<IRoom['name']>,
		discussion: boolean = false,
		teams: boolean = false,
		onlyTeams: boolean = false,
		options: FindOptions<IRoom> = {},
	): FindPaginated<FindCursor<IRoom>>;

	findByTeamId(teamId: ITeam['_id'], options: FindOptions<IRoom> = {}): FindCursor<IRoom>;

	findPaginatedByTeamIdContainingNameAndDefault(
		teamId: ITeam['_id'],
		name: IRoom['name'],
		teamDefault: boolean = false,
		ids: Array<IRoom['_id']> = [],
		options: FindOptions<IRoom> = {},
    ): FindPaginated<FindCursor<IRoom>>;

	findByTeamIdAndRoomsId(teamId: ITeam['_id'], rids: Array<IRoom['_id']>, options: FindOptions<IRoom> = {}): FindCursor<IRoom> {

findChannelAndPrivateByNameStarting(
		name: NonNullable<IRoom['name']>,
		sIds: Array<IRoom['_id']>,
		options: FindOptions<IRoom> = {},
    ): FindCursor<IRoom>

	findRoomsByNameOrFnameStarting(name: NonNullable<IRoom['name'] | IRoom['fname']>, options: FindOptions<IRoom> = {}): FindCursor<IRoom> {

	findRoomsWithoutDiscussionsByRoomIds(
		name: NonNullable<IRoom['name']>,
		roomIds: Array<IRoom['_id']>,
		options: FindOptions<IRoom> = {},
    ): FindCursor<IRoom>;

	findPaginatedRoomsWithoutDiscussionsByRoomIds(
        name: NonNullable<IRoom['name']>,
        roomIds: Array<IRoom['_id']>,
        options: FindOptions<IRoom> = {},
    ): FindPaginated<FindCursor<IRoom>>;

	findChannelAndGroupListWithoutTeamsByNameStartingByOwner(
        name: NonNullable<IRoom['name']>,
        groupsToAccept: Array<IRoom['_id']>,
        options: FindOptions<IRoom> = {},
    ): FindCursor<IRoom>;

	unsetTeamId(teamId: ITeam['_id'], options: UpdateOptions = {}): Promise<Document | UpdateResult>;

	unsetTeamById(rid: IRoom['_id'], options: UpdateOptions = {}): Promise<UpdateResult>;

	setTeamById(
        rid: IRoom['_id'],
        teamId: ITeam['_id'],
        teamDefault: IRoom['teamDefault'],
        options: UpdateOptions = {},
    ): Promise<UpdateResult>;

	setTeamMainById(rid: IRoom['_id'], teamId: ITeam['_id'], options: UpdateOptions = {}): Promise<UpdateResult>;

	setTeamByIds(rids: Array<IRoom['_id']>, teamId: ITeam['_id'], options: UpdateOptions = {}): Promise<Document | UpdateResult>;

	setTeamDefaultById(rid: IRoom['_id'], teamDefault: IRoom['teamDefault'], options: UpdateOptions = {}): Promise<UpdateResult>;

	findChannelsWithNumberOfMessagesBetweenDate(params: {
        start: number;
        end: number;
        startOfLastWeek: number;
        endOfLastWeek: number;
        onlyCount: boolean;
        options: PaginatedRequest;
    }): AggregationCursor<IRoom>;

	findOneByName(name: IRoom['name'], options: FindOptions<IRoom> = {}): Promise<IRoom | null>;

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
		searchTerm: object | NonNullable<IRoom['name'] | IRoom['fname']>,
		teamIds: Array<ITeam['_id']>,
		roomIds: Array<IRoom['_id']>,
		options: FindOptions<IRoom> = {},
	): FindPaginated<FindCursor<IRoom>>;

	findPaginatedContainingNameOrFNameInIdsAsTeamMain(
		searchTerm: IRoom['name'] | IRoom['fname'],
		rids: Array<IRoom['_id']>,
		options: FindOptions<IRoom> = {},
	): FindPaginated<FindCursor<IRoom>>;

	findPaginatedByTypeAndIds(type: IRoom['t'], ids: string[], options?: FindOptions<IRoom>): FindPaginated<FindCursor<IRoom>>;

	findFederatedRooms(options?: FindOptions<IRoom>): FindCursor<IRoom>;
}
