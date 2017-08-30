export class RocketletMessagesConverter {
	constructor(orch) {
		this.orch = orch;
	}

	convertById(msgId) {
		const msg = RocketChat.models.Messages.getOneById(msgId);

		if (!msg) {
			return undefined;
		}

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

	convertRocketletMessage(message) {
		if (!message) {
			return undefined;
		}

		const room = RocketChat.models.Rooms.findOneById(message.room.id);
		const user = RocketChat.models.Users.findOneById(message.sender.id);

		if (!room || !user) {
			throw new Error('Invalid user or room provided on the message.');
		}

		return {
			_id: message.id || Random.id(),
			msg: message.text,
			rid: room._id,
			u: {
				_id: user._id,
				username: user.username
			}
		};
	}
}
