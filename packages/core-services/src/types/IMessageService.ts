import type { IMessage, MessageTypesValues, IUser, AtLeast } from '@rocket.chat/core-typings';

export interface IMessageService {
	sendMessage(userId: string, message: AtLeast<IMessage, 'rid'>): Promise<IMessage>;
	updateMessage(message: IMessage, editor: IUser): Promise<void>;
	deleteMessage(message: IMessage, user: IUser): Promise<void>;
	saveSystemMessage<T = IMessage>(
		type: MessageTypesValues,
		rid: string,
		message: string,
		user: Pick<IUser, '_id' | 'username' | 'name'>,
		extraData?: Partial<T>,
	): Promise<IMessage['_id']>;
}
