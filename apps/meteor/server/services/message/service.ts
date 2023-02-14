import type { IMessage, IUser } from '@rocket.chat/core-typings';

import type { IMessageService } from '../../sdk/types/IMessageService';
import { ServiceClassInternal } from '../../sdk/types/ServiceClass';
import { updateMessage } from '../../../app/lib/server';
import { executeSendMessage } from '../../../app/lib/server/methods/sendMessage';

export class MessageService extends ServiceClassInternal implements IMessageService {
	protected name = 'message';

	async sendMessage(userId: string, message: IMessage): Promise<IMessage> {
		return executeSendMessage(userId, message);
	}

	async updateMessage(message: IMessage, editor: IUser): Promise<void> {
		return updateMessage(message, editor);
	}
}
