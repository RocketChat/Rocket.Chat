import { ITeam, ITeamMember, IRecordsWithTotal, IPaginationOptions, ITeamUpdate } from '../../../definition/ITeam';
import { ICreateRoomParams } from './IRoomService';

export interface ITeamCreateParams {
	team: Pick<ITeam, 'name' | 'type'>;
	room: Omit<ICreateRoomParams, 'type'>;
	members?: Array<string>; // list of user _ids
	owner?: string; // the team owner. If not present, owner = requester
}

export interface ITeamService {
	create(uid: string, params: ITeamCreateParams): Promise<ITeam>;
	list(uid: string, options?: IPaginationOptions): Promise<IRecordsWithTotal<ITeam>>;
	listAll(options?: IPaginationOptions): Promise<IRecordsWithTotal<ITeam>>;
	members(uid: string, teamId: string): Promise<Array<ITeamMember>>;
	update(teamId: string, team: ITeamUpdate): void;
}
