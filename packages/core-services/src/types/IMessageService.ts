import type { IMessage, MessageTypesValues, IUser, IRoom, AtLeast } from '@rocket.chat/core-typings';

export interface IMessageService {
	sendMessage({ fromId, rid, msg }: { fromId: string; rid: string; msg: string }): Promise<IMessage>;
	saveSystemMessage<T = IMessage>(
		type: MessageTypesValues,
		rid: string,
		message: string,
		user: Pick<IUser, '_id' | 'username' | 'name'>,
		extraData?: Partial<T>,
	): Promise<IMessage>;
	saveSystemMessageAndNotifyUser<T = IMessage>(
		type: MessageTypesValues,
		rid: string,
		message: string,
		user: Pick<IUser, '_id' | 'username' | 'name'>,
		extraData?: Partial<T>,
	): Promise<IMessage>;
	beforeSave(param: { message: IMessage; room: IRoom; user: IUser }): Promise<IMessage>;
	sendMessageWithValidation(user: IUser, message: Partial<IMessage>, room: Partial<IRoom>, upsert?: boolean): Promise<IMessage>;
	deleteMessage(user: IUser, message: IMessage): Promise<void>;
	updateMessage(message: IMessage, user: IUser, originalMsg?: IMessage): Promise<void>;
	reactToMessage(userId: string, reaction: string, messageId: IMessage['_id'], shouldReact?: boolean): Promise<void>;
	beforeReacted(message: IMessage, room: AtLeast<IRoom, 'federated'>): Promise<void>;
	beforeDelete(message: IMessage, room: IRoom): Promise<void>;
}
