import type { IMessage } from '@rocket.chat/core-typings';

export interface IMessageService {
	sendMessage({ fromId, rid, msg }: { fromId: string; rid: string; msg: string }): Promise<IMessage>;
}
