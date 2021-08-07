import { ITaskRoom, TASKRoomType } from '../../../definition/ITaskRoom';
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
}
