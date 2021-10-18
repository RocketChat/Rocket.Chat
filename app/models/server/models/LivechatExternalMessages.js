import { Base } from './_Base';

export class LivechatExternalMessage extends Base {
	constructor() {
		super('livechat_external_message');

		this.tryEnsureIndex({ rid: 1 });
	}

	// FIND
	findByRoomId(roomId, sort = { ts: -1 }) {
		const query = { rid: roomId };

		return this.find(query, { sort });
	}
}

export default new LivechatExternalMessage();
