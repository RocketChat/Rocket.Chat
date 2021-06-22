import { IRoom } from '../../../../../../definition/IRoom';

export type RoomInfo = {
	GET: (params: { roomId: string } | { roomName: string }) => { room: IRoom; success: boolean };
};
