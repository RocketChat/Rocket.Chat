import type { IMessage, MessageTypesValues } from '@rocket.chat/core-typings';

export interface IMessageService {
	sendMessage({ fromId, rid, msg }: { fromId: string; rid: string; msg: string }): Promise<IMessage>;
	saveSystemMessage<T = IMessage>(
		type: MessageTypesValues,
		rid: string,
		message: string,
		user: Pick<IMessage['u'], '_id' | 'username'>,
		extraData?: Partial<T>,
	): Promise<IMessage['_id']>;
}
