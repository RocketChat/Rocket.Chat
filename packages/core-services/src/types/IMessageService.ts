import type { IMessage } from '@rocket.chat/core-typings';

export interface IMessageService {
	createDirectMessage(data: { to: string; from: string }): Promise<{ rid: string }>;
	sendMessage({ fromId, rid, msg }: { fromId: string; rid: string; msg: string }): Promise<IMessage>;
}
