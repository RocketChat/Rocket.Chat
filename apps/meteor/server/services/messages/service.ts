import type { IMessage, MessageTypesValues, IUser, AtLeast } from '@rocket.chat/core-typings';
import type { IMessageService } from '@rocket.chat/core-services';
import { ServiceClassInternal } from '@rocket.chat/core-services';
import { Messages } from '@rocket.chat/models';

import { updateMessage, deleteMessage } from '../../../app/lib/server';
import { executeSendMessage } from '../../../app/lib/server/methods/sendMessage';
import { settings } from '../../../app/settings/server';

export class MessageService extends ServiceClassInternal implements IMessageService {
	protected name = 'message';

	async sendMessage(userId: string, message: AtLeast<IMessage, 'rid'>): Promise<IMessage> {
		return executeSendMessage(userId, message);
	}

	async updateMessage(message: IMessage, editor: IUser): Promise<void> {
		return updateMessage(message, editor);
	}

	async deleteMessage(message: IMessage, user: IUser): Promise<void> {
		return deleteMessage(message, user);
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
