/**
 * Livechat Message model
 */
class LivechatMessage extends RocketChat.models._Base {
	constructor() {
		super('rocketchat_message');
	}
}

RocketChat.models.LivechatMessage = new LivechatMessage();
