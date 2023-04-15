import type { IMessage, MessageTypesValues, IUser } from '@rocket.chat/core-typings';

export interface IMessageService {
	sendMessage({ fromId, rid, msg }: { fromId: string; rid: string; msg: string }): Promise<IMessage>;
	saveSystemMessage<T = IMessage>(
		type: MessageTypesValues,
		rid: string,
		message: string,
		user: Pick<IUser, '_id' | 'username' | 'name'>,
		extraData?: Partial<T>,
	): Promise<IMessage['_id']>;
}
