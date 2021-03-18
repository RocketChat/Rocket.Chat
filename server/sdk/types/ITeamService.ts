import { ITeam, ITeamMember, IRecordsWithTotal, IPaginationOptions } from '../../../definition/ITeam';
import { IRoom } from '../../../definition/IRoom';
import { ICreateRoomParams } from './IRoomService';
import { FindOneOptions } from 'mongodb';

export interface ITeamCreateRoom extends Omit<ICreateRoomParams, 'type'> {
	id?: string;
}

export interface ITeamCreateParams {
	team: Pick<ITeam, 'name' | 'type'>;
	room: ITeamCreateRoom;
	members?: Array<string>; // list of user _ids
	owner?: string; // the team owner. If not present, owner = requester
}

export interface ITeamMemberParams {
	userId?: string;
	userName?: string;
	roles?: Array<string>;
}

export interface ITeamService {
	create(uid: string, params: ITeamCreateParams): Promise<ITeam>;
	addRoom(uid: string, rid: string, teamId: string, isDefault: boolean): Promise<IRoom>;
	removeRoom(uid: string, rid: string, teamId: string): Promise<IRoom>;
	listRooms(uid: string, teamId: string, getAllRooms: boolean, allowPrivateTeam: boolean, pagination: IPaginationOptions): Promise<IRecordsWithTotal<IRoom>>;
	updateRoom(uid: string, rid: string, isDefault: boolean): Promise<IRoom>;
	list(uid: string, options?: IPaginationOptions): Promise<IRecordsWithTotal<ITeam>>;
	listAll(options?: IPaginationOptions): Promise<IRecordsWithTotal<ITeam>>;
	search(userId: string, term: string | RegExp, options?: FindOneOptions<ITeam>): Promise<ITeam[]>;
	members(teamId: string, teamName: string, options?: IPaginationOptions): Promise<IRecordsWithTotal<ITeamMember>>;
	addMembers(uid: string, teamId: string, teamName: string, members: Array<ITeamMemberParams>): Promise<void>;
	updateMember(teamId: string, teamName: string, members: ITeamMemberParams): Promise<void>;
	removeMembers(teamId: string, teamName: string, members: Array<ITeamMemberParams>): Promise<void>;
	getInfoByName(teamName: string): Promise<Partial<ITeam> | undefined>;
	getInfoById(teamId: string): Promise<Partial<ITeam> | undefined>;
	deleteById(teamId: string): Promise<boolean>;
	deleteByName(teamName: string): Promise<boolean>;
}
