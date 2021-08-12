import { IRoom } from '../../../../../../definition/IRoom';

export type RoomsInfo = {
	GET: (params: { roomId: string } | { roomName: string }) => { room: IRoom; success: boolean };
};
