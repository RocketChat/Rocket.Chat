export class AppMessageBridge {
	constructor(orch) {
		this.orch = orch;
	}

	async create(message, appId) {
		console.log(`The App ${ appId } is creating a new message.`);

		let msg = this.orch.getConverters().get('messages').convertAppMessage(message);

		Meteor.runAsUser(msg.u._id, () => {
			msg = Meteor.call('sendMessage', msg);
		});

		return msg._id;
	}

	async getById(messageId, appId) {
		console.log(`The App ${ appId } is getting the message: "${ messageId }"`);

		return this.orch.getConverters().get('messages').convertById(messageId);
	}

	async update(message, appId) {
		console.log(`The App ${ appId } is updating a message.`);

		if (!message.editor) {
			throw new Error('Invalid editor assigned to the message for the update.');
		}

		if (!message.id || !RocketChat.models.Messages.findOneById(message.id)) {
			throw new Error('A message must exist to update.');
		}

		const msg = this.orch.getConverters().get('messages').convertAppMessage(message);
		const editor = RocketChat.models.Users.findOneById(message.editor.id);

		RocketChat.updateMessage(msg, editor);
	}

	async notifyUser(user, message, appId) {
		console.log(`The App ${ appId } is notifying a user.`);

		const msg = this.orch.getConverters().get('messages').convertAppMessage(message);

		RocketChat.Notifications.notifyUser(user.id, 'message', Object.assign(msg, {
			_id: Random.id(),
			ts: new Date(),
			u: undefined,
			editor: undefined
		}));
	}

	async notifyRoom(room, message, appId) {
		console.log(`The App ${ appId } is notifying a room's users.`);

		if (room && room.usernames && Array.isArray(room.usernames)) {
			const msg = this.orch.getConverters().get('messages').convertAppMessage(message);
			const rmsg = Object.assign(msg, {
				_id: Random.id(),
				rid: room.id,
				ts: new Date(),
				u: undefined,
				editor: undefined
			});

			room.usernames.forEach((u) => {
				const user = RocketChat.models.Users.findOneByUsername(u);
				if (user) {
					RocketChat.Notifications.notifyUser(user._id, 'message', rmsg);
				}
			});
		}
	}
}
