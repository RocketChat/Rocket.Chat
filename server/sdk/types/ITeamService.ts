import { ITeam, ITeamMember, IRecordsWithTotal, IPaginationOptions } from '../../../definition/ITeam';
import { IRoom } from '../../../definition/IRoom';
import { ICreateRoomParams } from './IRoomService';

export interface ITeamCreateParams {
	team: Pick<ITeam, 'name' | 'type'>;
	room: Omit<ICreateRoomParams, 'type'>;
	members?: Array<string>; // list of user _ids
	owner?: string; // the team owner. If not present, owner = requester
}
export interface ITeamService {
	create(uid: string, params: ITeamCreateParams): Promise<ITeam>;
	addRoom(uid: string, rid: string, teamId: string, isDefault: boolean): Promise<IRoom>;
	removeRoom(uid: string, rid: string, teamId: string): Promise<IRoom>;
	listRooms(uid: string, teamId: string): Promise<Array<IRoom>>;
	updateRoom(uid: string, rid: string, isDefault: boolean): Promise<IRoom>;
	list(uid: string, options?: IPaginationOptions): Promise<IRecordsWithTotal<ITeam>>;
	listAll(options?: IPaginationOptions): Promise<IRecordsWithTotal<ITeam>>;
	members(uid: string, teamId: string): Promise<Array<ITeamMember>>;
}
