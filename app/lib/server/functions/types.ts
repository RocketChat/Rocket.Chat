import { IRoom } from '../../../../definition/IRoom';

export interface ICreateDirectRoomResult extends Partial<IRoom> {
	usernames: string[];
	inserted: boolean;
}
