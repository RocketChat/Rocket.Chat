import { IRoom } from '../../../definition/IRoom';

export interface ICreateRoomParams {
	type: IRoom['t'];
	name: IRoom['name'];
	members?: Array<string>; // member's usernames
	readOnly?: boolean;
	extraData?: Record<string, any>; // TODO map possible values
	options?: Record<string, any>; // TODO maps possible values
}
export interface IRoomService {
	addMember(uid: string, rid: string): Promise<boolean>;
	create(uid: string, params: ICreateRoomParams): Promise<IRoom>;
}
