import type { IMessage, MessageTypesValues } from '@rocket.chat/core-typings';
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
		user: Pick<IMessage['u'], '_id' | 'username'>,
		extraData?: Partial<T>,
	): Promise<IMessage['_id']> {
		const result = await Messages.createWithTypeRoomIdMessageUserAndUnread(
			type,
			rid,
			message,
			user,
			settings.get('Message_Read_Receipt_Enabled'),
			extraData,
		);

		return result.insertedId;
	}
}
