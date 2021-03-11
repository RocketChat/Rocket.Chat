import { ITeam, IListResponse, IPaginationOptions } from '../../../definition/ITeam';
import { ICreateRoomParams } from './IRoomService';

export interface ITeamCreateParams {
	team: Pick<ITeam, 'name' | 'type'>;
	room: Omit<ICreateRoomParams, 'type'>;
	members?: Array<string>; // list of user _ids
}

export interface ITeamService {
	create(uid: string, params: ITeamCreateParams): Promise<ITeam>;
	list(uid: string, options?: IPaginationOptions): Promise<IListResponse>;
	listAll(options?: IPaginationOptions): Promise<IListResponse>;
}
