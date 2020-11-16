import { Messages, Users, Subscriptions } from '../../../models/server';
import { updateMessage } from '../../../lib/server/functions/updateMessage';
import { executeSendMessage } from '../../../lib/server/methods/sendMessage';
import { api } from '../../../../server/sdk/api';
import notifications from '../../../notifications/server/lib/Notifications';

export class AppMessageBridge {
	constructor(orch) {
		this.orch = orch;
	}

	async create(message, appId) {
		this.orch.debugLog(`The App ${ appId } is creating a new message.`);

		const convertedMessage = this.orch.getConverters().get('messages').convertAppMessage(message);

		const sentMessage = executeSendMessage(convertedMessage.u._id, convertedMessage);

		return sentMessage._id;
	}

	async getById(messageId, appId) {
		this.orch.debugLog(`The App ${ appId } is getting the message: "${ messageId }"`);

		return this.orch.getConverters().get('messages').convertById(messageId);
	}

	async update(message, appId) {
		this.orch.debugLog(`The App ${ appId } is updating a message.`);

		if (!message.editor) {
			throw new Error('Invalid editor assigned to the message for the update.');
		}

		if (!message.id || !Messages.findOneById(message.id)) {
			throw new Error('A message must exist to update.');
		}

		const msg = this.orch.getConverters().get('messages').convertAppMessage(message);
		const editor = Users.findOneById(message.editor.id);

		updateMessage(msg, editor);
	}

	async notifyUser(user, message, appId) {
		this.orch.debugLog(`The App ${ appId } is notifying a user.`);

		const msg = this.orch.getConverters().get('messages').convertAppMessage(message);

		if (!msg) {
			return;
		}

		api.broadcast('notify.ephemeralMessage', user.id, msg.rid, {
			...msg,
		});
	}

	async notifyRoom(room, message, appId) {
		this.orch.debugLog(`The App ${ appId } is notifying a room's users.`);

		if (!room || !room.id) {
			return;
		}

		const msg = this.orch.getConverters().get('messages').convertAppMessage(message);

		const users = Subscriptions.findByRoomIdWhenUserIdExists(room.id, { fields: { 'u._id': 1 } })
			.fetch()
			.map((s) => s.u._id);

		Users.findByIds(users, { fields: { _id: 1 } })
			.fetch()
			.forEach(({ _id }) =>
				api.broadcast('notify.ephemeralMessage', _id, room.id, {
					...msg,
				}),
			);
	}

	async typing({ scope, id, username, isTyping }) {
		switch (scope) {
			case 'room':
				notifications.notifyRoom(id, 'typing', username, isTyping);
				return;
			default:
				throw new Error('Unrecognized typing scope provided');
		}
	}
}
