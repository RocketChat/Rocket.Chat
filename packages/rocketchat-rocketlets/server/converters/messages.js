export class RocketletMessagesConverter {
	constructor(orch) {
		this.orch = orch;
	}

	convertById(msgId) {
		const msg = RocketChat.models.Messages.getOneById(msgId);

		return {
			id: msg._id,
			text: msg.msg
		};
	}

	convertMessage(msgObj) {
		return {
			id: msgObj._id,
			text: msgObj.msg
		};
	}
}
