import { getVoipRoomType } from '../../../../lib/rooms/roomTypes/voip';
import { roomCoordinator } from '../roomCoordinator';

export const VoipRoomType = getVoipRoomType(roomCoordinator);

roomCoordinator.add(VoipRoomType, {
	roomName(room: any): string | undefined {
		return room.name || room.fname || room.label;
	},
});
