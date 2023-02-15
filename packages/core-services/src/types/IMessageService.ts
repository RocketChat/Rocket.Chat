import type { IMessage, IUser } from '@rocket.chat/core-typings';

import type { IServiceClass } from './ServiceClass';

export interface IMessageService extends IServiceClass {
	sendMessage(userId: string, message: IMessage): Promise<IMessage>;
	sendMessage({ fromId, rid, msg }: { fromId: string; rid: string; msg: string }): Promise<IMessage>;
	updateMessage(message: IMessage, editor: IUser): Promise<void>;
}
