class LivechatExternalMessage extends RocketChat.models._Base {
	constructor() {
		super('livechat_external_message');

		if (Meteor.isClient) {
			this._initModel('livechat_external_message');
		}
	}

	// FIND
	findByRoomId(roomId, sort = { ts: -1 }) {
		const query = { rid: roomId };

		return this.find(query, { sort });
	}
}

RocketChat.models.LivechatExternalMessage = new LivechatExternalMessage();
