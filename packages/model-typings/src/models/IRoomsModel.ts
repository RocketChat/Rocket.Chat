import type { FindCursor, AggregationCursor, Document, FindOptions } from 'mongodb';
import type { IRoom } from '@rocket.chat/core-typings';

import type { FindPaginated, IBaseModel } from './IBaseModel';

export interface IRoomsModel extends IBaseModel<IRoom> {
	findOneByRoomIdAndUserId(rid: any, uid: any, options?: any): any;

	findManyByRoomIds(roomIds: any, options?: any): any;

	findPaginatedByIds(roomIds: any, options?: any): any;

	getMostRecentAverageChatDurationTime(numberMostRecentChats: any, department: any): Promise<any>;

	findByNameContainingAndTypes(name: any, types: any, discussion?: boolean, teams?: boolean, showOnlyTeams?: boolean, options?: any): any;

	findByTypes(types: any, discussion?: boolean, teams?: boolean, onlyTeams?: boolean, options?: any): any;

	findByNameContaining(name: any, discussion?: boolean, teams?: boolean, onlyTeams?: boolean, options?: any): any;

	findByTeamId(teamId: any, options?: any): any;

	findPaginatedByTeamIdContainingNameAndDefault(teamId: any, name: any, teamDefault: any, ids: any, options?: any): any;

	findByTeamIdAndRoomsId(teamId: any, rids: any, options?: any): any;

	findChannelAndPrivateByNameStarting(name: any, sIds: any, options: any): any;

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

	setRoomNameById(roomId: any, name: any, fname: any): any;

	setRoomTopicById(roomId: any, topic: any): any;

	findByE2E(options: any): any;

	findRoomsInsideTeams(autoJoin?: boolean): any;

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
}
