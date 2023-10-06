import type { IMessage } from '@rocket.chat/apps-engine/definition/messages';
import type { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import type { IUser } from '@rocket.chat/apps-engine/definition/users';
import type { ITypingDescriptor } from '@rocket.chat/apps-engine/server/bridges/MessageBridge';
import { MessageBridge } from '@rocket.chat/apps-engine/server/bridges/MessageBridge';
import { api } from '@rocket.chat/core-services';
import { Users, Subscriptions, Messages } from '@rocket.chat/models';

import type { AppServerOrchestrator } from '../../../../ee/server/apps/orchestrator';
import { deleteMessage } from '../../../lib/server/functions/deleteMessage';
import { updateMessage } from '../../../lib/server/functions/updateMessage';
import { executeSendMessage } from '../../../lib/server/methods/sendMessage';
import notifications from '../../../notifications/server/lib/Notifications';

export class AppMessageBridge extends MessageBridge {
	constructor(private readonly orch: AppServerOrchestrator) {
		super();
	}

	protected async create(message: IMessage, appId: string): Promise<string> {
		this.orch.debugLog(`The App ${appId} is creating a new message.`);

		const convertedMessage = await this.orch.getConverters()?.get('messages').convertAppMessage(message);

		const sentMessage = await executeSendMessage(convertedMessage.u._id, convertedMessage);

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

		if (!message.id || !(await Messages.findOneById(message.id))) {
			throw new Error('A message must exist to update.');
		}

		const msg = await this.orch.getConverters()?.get('messages').convertAppMessage(message);
		const editor = await Users.findOneById(message.editor.id);

		if (!editor) {
			throw new Error('Invalid editor assigned to the message for the update.');
		}

		await updateMessage(msg, editor);
	}

	protected async delete(message: IMessage, user: IUser, appId: string): Promise<void> {
		this.orch.debugLog(`The App ${appId} is deleting a message.`);

		if (!message.id) {
			throw new Error('Invalid message id');
		}

		const convertedMsg = await this.orch.getConverters()?.get('messages').convertAppMessage(message);
		const convertedUser = await this.orch.getConverters()?.get('users').convertById(user.id);

		await deleteMessage(convertedMsg, convertedUser);
	}

	protected async notifyUser(user: IUser, message: IMessage, appId: string): Promise<void> {
		this.orch.debugLog(`The App ${appId} is notifying a user.`);

		const msg = await this.orch.getConverters()?.get('messages').convertAppMessage(message);

		if (!msg) {
			return;
		}

		void api.broadcast('notify.ephemeralMessage', user.id, msg.rid, {
			...msg,
		});
	}

	protected async notifyRoom(room: IRoom, message: IMessage, appId: string): Promise<void> {
		this.orch.debugLog(`The App ${appId} is notifying a room's users.`);

		if (!room?.id) {
			return;
		}

		const msg = await this.orch.getConverters()?.get('messages').convertAppMessage(message);

		const users = (await Subscriptions.findByRoomIdWhenUserIdExists(room.id, { projection: { 'u._id': 1 } }).toArray()).map((s) => s.u._id);

		await Users.findByIds(users, { projection: { _id: 1 } }).forEach(
			({ _id }: { _id: string }) =>
				void api.broadcast('notify.ephemeralMessage', _id, room.id, {
					...msg,
				}),
		);
	}

	protected async typing({ scope, id, username, isTyping }: ITypingDescriptor): Promise<void> {
		switch (scope) {
			case 'room':
				notifications.notifyRoom(id, 'typing', username!, isTyping);
				return;
			default:
				throw new Error('Unrecognized typing scope provided');
		}
	}
}
