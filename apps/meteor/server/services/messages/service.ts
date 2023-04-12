import type { IMessage, MessageTypesValues, IUser } from '@rocket.chat/core-typings';
import type { IMessageService } from '@rocket.chat/core-services';
import { ServiceClassInternal } from '@rocket.chat/core-services';
import { Messages } from '@rocket.chat/models';

import { executeSendMessage } from '../../../app/lib/server/methods/sendMessage';
import { settings } from '../../../app/settings/server';

export class MessageService extends ServiceClassInternal implements IMessageService {
	protected name = 'message';

	async sendMessage({ fromId, rid, msg }: { fromId: string; rid: string; msg: string }): Promise<IMessage> {
		return executeSendMessage(fromId, { rid, msg });
	}

	async saveSystemMessage<T = IMessage>(
		type: MessageTypesValues,
		rid: string,
		message: string,
		owner: Pick<IUser, '_id' | 'username'>,
		extraData?: Partial<T>,
	): Promise<IMessage['_id']> {
		const { _id: userId, username } = owner;
		if (!username) {
			throw new Error('The username cannot be empty.');
		}
		const result = await Messages.createWithTypeRoomIdMessageUserAndUnread(
			type,
			rid,
			message,
			{ _id: userId, username },
			settings.get('Message_Read_Receipt_Enabled'),
			extraData,
		);

		return result.insertedId;
	}
}
