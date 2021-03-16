import { ITeam, ITeamMember, IRecordsWithTotal, IPaginationOptions } from '../../../definition/ITeam';
import { ICreateRoomExtraData } from './IRoomService';

export interface ITeamCreateRoom {
	name: string;
	id?: string;
	extraData?: Partial<ICreateRoomExtraData>;
}

export interface ITeamCreateParams {
	team: Pick<ITeam, 'name' | 'type'>;
	room: ITeamCreateRoom;
	members?: Array<string>; // list of user _ids
	owner?: string; // the team owner. If not present, owner = requester
}

export interface ITeamService {
	create(uid: string, params: ITeamCreateParams): Promise<ITeam>;
	list(uid: string, options?: IPaginationOptions): Promise<IRecordsWithTotal<ITeam>>;
	listAll(options?: IPaginationOptions): Promise<IRecordsWithTotal<ITeam>>;
	members(uid: string, teamId: string): Promise<Array<ITeamMember>>;
	getInfoByName(teamName: string): Promise<Partial<ITeam> | undefined>;
	getInfoById(teamId: string): Promise<Partial<ITeam> | undefined>;
}
