import type { IAppServerOrchestrator, IAppsMessage, IAppsUser } from '@rocket.chat/apps';
import type { Reaction } from '@rocket.chat/apps-engine/definition/messages';
import type { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import type { ITypingDescriptor } from '@rocket.chat/apps-engine/server/bridges/MessageBridge';
import { MessageBridge } from '@rocket.chat/apps-engine/server/bridges/MessageBridge';
import { api } from '@rocket.chat/core-services';
import type { IMessage } from '@rocket.chat/core-typings';
import { Users, Subscriptions } from '@rocket.chat/models';

import { deleteMessage } from '../../../lib/server/functions/deleteMessage';
import { updateMessage } from '../../../lib/server/functions/updateMessage';
import { executeSendMessage } from '../../../lib/server/methods/sendMessage';
import notifications from '../../../notifications/server/lib/Notifications';
import { executeSetReaction } from '../../../reactions/server/setReaction';

export class AppMessageBridge extends MessageBridge {
	constructor(private readonly orch: IAppServerOrchestrator) {
		super();
	}

	protected async create(message: IAppsMessage, appId: string): Promise<string> {
		this.orch.debugLog(`The App ${appId} is creating a new message.`);

		const convertedMessage: IMessage | undefined = await this.orch.getConverters()?.get('messages').convertAppMessage(message);
		// #TODO: #AppsEngineTypes - Remove explicit types and typecasts once the apps-engine definition/implementation mismatch is fixed.
		const definedMessage = convertedMessage as IMessage;

		const sentMessage = await executeSendMessage(definedMessage.u._id, definedMessage);
		return sentMessage._id;
	}

	protected async getById(messageId: string, appId: string): Promise<IAppsMessage> {
		this.orch.debugLog(`The App ${appId} is getting the message: "${messageId}"`);

		// #TODO: #AppsEngineTypes - Remove explicit types and typecasts once the apps-engine definition/implementation mismatch is fixed.
		const message: IAppsMessage | undefined = await this.orch.getConverters()?.get('messages').convertById(messageId);
		return message as IAppsMessage;
	}

	protected async update(message: IAppsMessage, appId: string): Promise<void> {
		this.orch.debugLog(`The App ${appId} is updating a message.`);

		if (!message.editor) {
			throw new Error('Invalid editor assigned to the message for the update.');
		}

		// #TODO: #AppsEngineTypes - Remove explicit types and typecasts once the apps-engine definition/implementation mismatch is fixed.
		const msg = await this.orch.getConverters()?.get('messages').convertAppMessage(message, true);
		const editor = await Users.findOneById(message.editor.id);

		if (!editor) {
			throw new Error('Invalid editor assigned to the message for the update.');
		}

		await updateMessage(msg as IMessage, editor);
	}

	protected async delete(message: IAppsMessage, user: IAppsUser, appId: string): Promise<void> {
		this.orch.debugLog(`The App ${appId} is deleting a message.`);

		if (!message.id) {
			throw new Error('Invalid message id');
		}

		const convertedMsg = await this.orch.getConverters()?.get('messages').convertAppMessage(message);
		const convertedUser = (await Users.findOneById(user.id)) || this.orch.getConverters()?.get('users').convertToRocketChat(user);

		await deleteMessage(convertedMsg as IMessage, convertedUser);
	}

	protected async notifyUser(user: IAppsUser, message: IAppsMessage, appId: string): Promise<void> {
		this.orch.debugLog(`The App ${appId} is notifying a user.`);

		const msg = await this.orch.getConverters()?.get('messages').convertAppMessage(message);

		if (!msg) {
			return;
		}

		void api.broadcast('notify.ephemeralMessage', user.id, msg.rid, {
			...msg,
		});
	}

	protected async notifyRoom(room: IRoom, message: IAppsMessage, appId: string): Promise<void> {
		this.orch.debugLog(`The App ${appId} is notifying a room's users.`);

		if (!room?.id) {
			return;
		}

		// #TODO: #AppsEngineTypes - Remove explicit types and typecasts once the apps-engine definition/implementation mismatch is fixed.
		const msg: IMessage | undefined = await this.orch.getConverters()?.get('messages').convertAppMessage(message);
		const convertedMessage = msg as IMessage;

		const users = (await Subscriptions.findByRoomIdWhenUserIdExists(room.id, { projection: { 'u._id': 1 } }).toArray()).map((s) => s.u._id);

		await Users.findByIds(users, { projection: { _id: 1 } }).forEach(
			({ _id }: { _id: string }) =>
				void api.broadcast('notify.ephemeralMessage', _id, room.id, {
					...convertedMessage,
				}),
		);
	}

	protected async typing({ scope, id, username, isTyping }: ITypingDescriptor): Promise<void> {
		switch (scope) {
			case 'room':
				if (!username) {
					throw new Error('Invalid username');
				}

				notifications.notifyRoom(id, 'user-activity', username, isTyping ? ['user-typing'] : []);
				return;
			default:
				throw new Error('Unrecognized typing scope provided');
		}
	}

	private isValidReaction(reaction: Reaction): boolean {
		return reaction.startsWith(':') && reaction.endsWith(':');
	}

	protected async addReaction(messageId: string, userId: string, reaction: Reaction): Promise<void> {
		if (!this.isValidReaction(reaction)) {
			throw new Error('Invalid reaction');
		}

		return executeSetReaction(userId, reaction, messageId, true);
	}

	protected async removeReaction(messageId: string, userId: string, reaction: Reaction): Promise<void> {
		if (!this.isValidReaction(reaction)) {
			throw new Error('Invalid reaction');
		}

		return executeSetReaction(userId, reaction, messageId, false);
	}
}
