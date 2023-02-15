import type { IMessage, IUser } from '@rocket.chat/core-typings';
import type { IMessageService } from '@rocket.chat/core-services';
import { ServiceClassInternal } from '@rocket.chat/core-services';

import { updateMessage } from '../../../app/lib/server';
import { executeSendMessage } from '../../../app/lib/server/methods/sendMessage';

export class MessageService extends ServiceClassInternal implements IMessageService {
	protected name = 'message';

	async sendMessage(userId: string, message: Partial<IMessage>): Promise<IMessage> {
		return executeSendMessage(userId, message);
	}

	async updateMessage(message: IMessage, editor: IUser): Promise<void> {
		return updateMessage(message, editor);
	}
}
