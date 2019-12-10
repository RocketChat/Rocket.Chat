import { BaseRaw } from './BaseRaw';

export class LivechatExternalMessageRaw extends BaseRaw {
	findByRoomId(roomId, options) {
		const query = { rid: roomId };

		return this.find(query, options);
	}
}
