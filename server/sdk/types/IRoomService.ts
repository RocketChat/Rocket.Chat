// import { IRoom } from '../../../definition/IRoom';

export interface IRoomService {
	addMember(uid: string, rid: string): Promise<boolean>;
}
