import { ITeam } from '../../../definition/ITeam';
import { IRoom } from '../../../definition/IRoom';
import { ICreateRoomParams } from './IRoomService';

export interface ITeamCreateParams {
	team: Pick<ITeam, 'name' | 'type'>;
	room: Omit<ICreateRoomParams, 'type'>;
	members?: Array<string>; // list of user _ids
}
export interface ITeamService {
	create(uid: string, params: ITeamCreateParams): Promise<ITeam>;
	addRoom(uid: string, rid: string, teamId: string): Promise<IRoom>;
	removeRoom(uid: string, rid: string, teamId: string): Promise<IRoom>;
	listRooms(uid: string, teamId: string): Promise<Array<IRoom>>;
	list(uid: string, filter?: string): Promise<Array<ITeam>>;
}
