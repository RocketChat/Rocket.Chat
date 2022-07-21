import type { ITypingDescriptor } from '@rocket.chat/apps-engine/server/bridges/MessageBridge';
import { MessageBridge } from '@rocket.chat/apps-engine/server/bridges/MessageBridge';
import type { IMessage } from '@rocket.chat/apps-engine/definition/messages';
import type { IUser } from '@rocket.chat/apps-engine/definition/users';
import type { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import type { ISubscription } from '@rocket.chat/core-typings';

import { Messages, Users, Subscriptions } from '../../../models/server';
import { updateMessage } from '../../../lib/server/functions/updateMessage';
import { executeSendMessage } from '../../../lib/server/methods/sendMessage';
import { api } from '../../../../server/sdk/api';
import notifications from '../../../notifications/server/lib/Notifications';
import type { AppServerOrchestrator } from '../orchestrator';

export class AppMessageBridge extends MessageBridge {
	// eslint-disable-next-line no-empty-function
	constructor(private readonly orch: AppServerOrchestrator) {
		super();
	}

	protected async create(message: IMessage, appId: string): Promise<string> {
		this.orch.debugLog(`The App ${appId} is creating a new message.`);

		const convertedMessage = this.orch.getConverters()?.get('messages').convertAppMessage(message);

		const sentMessage = executeSendMessage(convertedMessage.u._id, convertedMessage);

		return sentMessage._id;
	}

	protected async getById(messageId: string, appId: string): Promise<IMessage> {
		this.orch.debugLog(`The App ${appId} is getting the message: "${messageId}"`);

		return this.orch.getConverters()?.get('messages').convertById(messageId);
	}

	protected async update(message: IMessage, appId: string): Promise<void> {
		this.orch.debugLog(`The App ${appId} is updating a message.`);

		if (!message.editor) {
			throw new Error('Invalid editor assigned to the message for the update.');
		}

		if (!message.id || !Messages.findOneById(message.id)) {
			throw new Error('A message must exist to update.');
		}

		const msg = this.orch.getConverters()?.get('messages').convertAppMessage(message);
		const editor = Users.findOneById(message.editor.id);

		updateMessage(msg, editor);
	}

	protected async notifyUser(user: IUser, message: IMessage, appId: string): Promise<void> {
		this.orch.debugLog(`The App ${appId} is notifying a user.`);

		const msg = this.orch.getConverters()?.get('messages').convertAppMessage(message);

		if (!msg) {
			return;
		}

		api.broadcast('notify.ephemeralMessage', user.id, msg.rid, {
			...msg,
		});
	}

	protected async notifyRoom(room: IRoom, message: IMessage, appId: string): Promise<void> {
		this.orch.debugLog(`The App ${appId} is notifying a room's users.`);

		if (!room || !room.id) {
			return;
		}

		const msg = this.orch.getConverters()?.get('messages').convertAppMessage(message);

		const users = Subscriptions.findByRoomIdWhenUserIdExists(room.id, { fields: { 'u._id': 1 } })
			.fetch()
			.map((s: ISubscription) => s.u._id);

		Users.findByIds(users, { fields: { _id: 1 } })
			.fetch()
			.forEach(({ _id }: { _id: string }) =>
				api.broadcast('notify.ephemeralMessage', _id, room.id, {
					...msg,
				}),
			);
	}

	protected async typing({ scope, id, username, isTyping }: ITypingDescriptor): Promise<void> {
		switch (scope) {
			case 'room':
				notifications.notifyRoom(id, 'typing', username, isTyping);
				return;
			default:
				throw new Error('Unrecognized typing scope provided');
		}
	}
}
