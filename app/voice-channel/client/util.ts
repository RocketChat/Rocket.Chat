import VoiceRoomClient from './index';
import { IRoom } from '../../../definition/IRoom';

export const createVoiceClient = (room: IRoom): VoiceRoomClient => {
	const client = new VoiceRoomClient({
		roomID: room._id,
		device: {},
		produce: true,
		consume: true,
		displayName: room.u.name || 'Anonymous',
		peerID: room.u._id,
		username: room.u.username,
		roomName: room.fname,
	});

	return client;
};
