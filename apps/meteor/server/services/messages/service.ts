import type { IMessageService } from '@rocket.chat/core-services';
import { ServiceClassInternal } from '@rocket.chat/core-services';
import type { IMessage, MessageTypesValues, IUser, IRoom } from '@rocket.chat/core-typings';
import { Messages } from '@rocket.chat/models';

import { deleteMessage } from '../../../app/lib/server/functions/deleteMessage';
import { sendMessage } from '../../../app/lib/server/functions/sendMessage';
import { updateMessage } from '../../../app/lib/server/functions/updateMessage';
import { executeSendMessage } from '../../../app/lib/server/methods/sendMessage';
import { executeSetReaction } from '../../../app/reactions/server/setReaction';
import { settings } from '../../../app/settings/server';

export class MessageService extends ServiceClassInternal implements IMessageService {
	protected name = 'message';

	async sendMessage({ fromId, rid, msg }: { fromId: string; rid: string; msg: string }): Promise<IMessage> {
		return executeSendMessage(fromId, { rid, msg });
	}

	async sendMessageWithValidation(user: IUser, message: Partial<IMessage>, room: Partial<IRoom>, upsert = false): Promise<IMessage> {
		return sendMessage(user, message, room, upsert);
	}

	async deleteMessage(user: IUser, message: IMessage): Promise<void> {
		return deleteMessage(message, user);
	}

	async updateMessage(message: IMessage, user: IUser, originalMsg?: IMessage): Promise<void> {
		return updateMessage(message, user, originalMsg);
	}

	async reactToMessage(userId: string, reaction: string, messageId: IMessage['_id'], shouldReact?: boolean): Promise<void> {
		return executeSetReaction(userId, reaction, messageId, shouldReact);
	}

	async saveSystemMessage<T = IMessage>(
		type: MessageTypesValues,
		rid: string,
		message: string,
		owner: Pick<IUser, '_id' | 'username' | 'name'>,
		extraData?: Partial<T>,
	): Promise<IMessage['_id']> {
		const { _id: userId, username, name } = owner;
		if (!username) {
			throw new Error('The username cannot be empty.');
		}
		const result = await Messages.createWithTypeRoomIdMessageUserAndUnread(
			type,
			rid,
			message,
			{ _id: userId, username, name },
			settings.get('Message_Read_Receipt_Enabled'),
			extraData,
		);

		return result.insertedId;
	}
}
