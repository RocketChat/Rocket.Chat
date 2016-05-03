class LivechatExternalMessage extends RocketChat.models._Base {
	constructor() {
		super();
		this._initModel('livechat_external_message');
	}

	// FIND
	findByRoomId(roomId, sort = { ts: -1 }) {
		const query = { rid: roomId };

		return this.find(query, { sort: sort });
	}
}

RocketChat.models.LivechatExternalMessage = new LivechatExternalMessage();
