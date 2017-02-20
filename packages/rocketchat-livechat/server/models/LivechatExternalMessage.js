class LivechatExternalMessage extends RocketChat.models._Base {
	constructor() {
		super('livechat_external_message');
		try {
			this.model = new Mongo.Collection('rocketchat_livechat_external_message');
		}
		catch(e){
			console.log('I do not get why this is getting called multiple times');
		}
	}

	// FIND
	findByRoomId(roomId, sort = { ts: -1 }) {
		const query = { rid: roomId };

		return this.find(query, { sort: sort });
	}
}

RocketChat.models.LivechatExternalMessage = new LivechatExternalMessage();
