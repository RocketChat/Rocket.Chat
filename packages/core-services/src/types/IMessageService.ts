import type { IMessage, IUser, MessageTypesValues } from '@rocket.chat/core-typings';

import type { IServiceClass } from './ServiceClass';

export interface IMessageService extends IServiceClass {
	sendMessage(userId: string, message: Partial<IMessage>): Promise<IMessage>;
	sendMessage({ fromId, rid, msg }: { fromId: string; rid: string; msg: string }): Promise<IMessage>;
	updateMessage(message: IMessage, editor: IUser): Promise<void>;
	saveSystemMessage<T = IMessage>(
		type: MessageTypesValues,
		rid: string,
		message: string,
		user: Pick<IUser, '_id' | 'username' | 'name'>,
		extraData?: Partial<T>,
	): Promise<IMessage['_id']>;
}
