import type { IMessage } from './IMessage/IMessage';
import type { IRocketChatRecord } from './IRocketChatRecord';

export interface IReport extends IRocketChatRecord {
	message: IMessage;
	description: string;
	ts: Date;
	userId: string;
}
