import { FilterQuery, FindOneOptions } from 'mongodb';

import { ITaskRoom, IRecordsWithTotal, IPaginationOptions, IQueryOptions, ITaskRoomMember, TASKRoomType } from '../../../definition/ITaskRoom';
import { IRoom } from '../../../definition/IRoom';
import { IUser } from '../../../definition/IUser';
import { ICreateRoomParams } from './IRoomService';

export interface ITaskRoomCreateRoom extends Omit<ICreateRoomParams, 'type'> {
	id?: string;
}

export interface ITaskRoomCreateParams {
	taskRoom: Pick<ITaskRoom, 'name' | 'type'>;
	room: ITaskRoomCreateRoom;
	members?: Array<string>; // list of user _ids
	owner?: string; // the team owner. If not present, owner = requester
}

export interface ITaskRoomMemberParams {
	userId: string;
	roles?: Array<string>;
}

export interface IUserInfo {
	_id: string;
	username?: string;
	name: string;
	status: string;
}

export interface ITaskRoomMemberInfo {
	user: IUserInfo;
	roles?: string[];
	createdBy: Omit<IUserInfo, 'name' | 'status'>;
	createdAt: Date;
}

export interface ITaskRoomInfo extends ITaskRoom {
	rooms: number;
	numberOfUsers: number;
}

export interface IListRoomsFilter {
	name: string;
	isDefault: boolean;
	getAllRooms: boolean;
	allowPrivateTeam: boolean;
}

export interface ITaskRoomUpdateData {
	name: string;
	type: TASKRoomType;
	updateRoom?: boolean; // default is true
}
// Copied for the team
export interface ITaskRoomService {
	create(uid: string, params: ITaskRoomCreateParams): Promise<ITaskRoom>;
	updateRoom(uid: string, rid: string, isDefault: boolean, canUpdateAnyRoom: boolean): Promise<IRoom>;
	list(uid: string, paginationOptions?: IPaginationOptions, queryOptions?: IQueryOptions<ITaskRoom>): Promise<IRecordsWithTotal<ITaskRoom>>;
	listAll(options?: IPaginationOptions): Promise<IRecordsWithTotal<ITaskRoom>>;
	listByNames(names: Array<string>, options?: FindOneOptions<ITaskRoom>): Promise<Array<ITaskRoom>>;
	listByIds(ids: Array<string>, options?: FindOneOptions<ITaskRoom>): Promise<ITaskRoom[]>;
	search(userId: string, term: string | RegExp, options?: FindOneOptions<ITaskRoom>): Promise<ITaskRoom[]>;
	members(uid: string, teamId: string, canSeeAll: boolean, options?: IPaginationOptions, queryOptions?: FilterQuery<IUser>): Promise<IRecordsWithTotal<ITaskRoomMemberInfo>>;
	addMembers(uid: string, teamId: string, members: Array<ITaskRoomMemberParams>): Promise<void>;
	updateMember(teamId: string, members: ITaskRoomMemberParams): Promise<void>;
	removeMembers(uid: string, teamId: string, members: Array<ITaskRoomMemberParams>): Promise<boolean>;
	getInfoByName(teamName: string): Promise<Partial<ITaskRoom> | undefined>;
	getInfoById(teamId: string): Promise<Partial<ITaskRoom> | undefined>;
	deleteById(teamId: string): Promise<boolean>;
	deleteByName(teamName: string): Promise<boolean>;
	unsetTeamIdOfRooms(teamId: string): void;
	getOneById(teamId: string, options?: FindOneOptions<ITaskRoom>): Promise<ITaskRoom | undefined>;
	getOneByName(teamName: string | RegExp, options?: FindOneOptions<ITaskRoom>): Promise<ITaskRoom | null>;
	getOneByMainRoomId(teamId: string): Promise<ITaskRoom | null>;
	getOneByRoomId(teamId: string): Promise<ITaskRoom | undefined>;
	getMatchingTeamRooms(teamId: string, rids: Array<string>): Promise<Array<string>>;
	autocomplete(uid: string, name: string): Promise<Array<IRoom>>;
	getAllPublicTeams(options: FindOneOptions<ITaskRoom>): Promise<Array<ITaskRoom>>;
	getMembersByTeamIds(teamIds: Array<string>, options: FindOneOptions<ITaskRoomMember>): Promise<Array<ITaskRoomMember>>;
	update(uid: string, teamId: string, updateData: ITaskRoomUpdateData): Promise<void>;
	listTeamsBySubscriberUserId(uid: string, options?: FindOneOptions<ITaskRoomMember>): Promise<Array<ITaskRoomMember> | null>;
}
