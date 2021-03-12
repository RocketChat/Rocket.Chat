import { ITeam, IRecordsWithTotal, IPaginationOptions } from '../../../definition/ITeam';
import { ICreateRoomParams } from './IRoomService';

export interface ITeamCreateParams {
	team: Pick<ITeam, 'name' | 'type'>;
	room: Omit<ICreateRoomParams, 'type'>;
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
	list(uid: string, options?: IPaginationOptions): Promise<IRecordsWithTotal<ITeam>>;
	listAll(options?: IPaginationOptions): Promise<IRecordsWithTotal<ITeam>>;
	members(uid: string, teamId: string, teamName: string, options?: IPaginationOptions): Promise<IRecordsWithTotal<ITeamMember>>;
	addMembers(uid: string, teamId: string, teamName: string, members: Array<ITeamMemberParams>): Promise<void>;
	updateMember(uid: string, teamId: string, teamName: string, members: ITeamMemberParams): Promise<void>;
	removeMembers(uid: string, teamId: string, teamName: string, members: Array<ITeamMemberParams>): Promise<void>;
}
