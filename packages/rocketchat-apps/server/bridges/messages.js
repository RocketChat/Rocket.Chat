export class AppMessageBridge {
	constructor(orch) {
		this.orch = orch;
	}

	create(message, appId) {
		console.log(`The App ${ appId } is creating a new message.`);

		let msg = this.orch.getConverters().get('messages').convertAppMessage(message);

		Meteor.runAsUser(msg.u._id, () => {
			msg = Meteor.call('sendMessage', msg);
		});

		return msg._id;
	}

	getById(messageId, appId) {
		console.log(`The App ${ appId } is getting the message: "${ messageId }"`);

		return this.orch.getConverters().get('messages').convertById(messageId);
	}

	update(message, appId) {
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

	notifyUser(user, message, appId) {
		console.log(`The App ${ appId } is notifying a user.`);

		const msg = this.orch.getConverters().get('messages').convertAppMessage(message);

		RocketChat.Notifications.notifyUser(user.id, 'message', Object.assign(msg, {
			_id: Random.id(),
			ts: new Date(),
			u: undefined,
			editor: undefined
		}));
	}

	notifyRoom(room, message, appId) {
		console.log(`The App ${ appId } is notifying a room's users.`);

		const msg = this.orch.getConverters().get('messages').convertAppMessage(message);

		RocketChat.Notifications.notifyUsersOfRoom(room.id, 'message', Object.assign(msg, {
			_id: Random.id(),
			ts: new Date(),
			u: undefined,
			editor: undefined
		}));
	}
}
