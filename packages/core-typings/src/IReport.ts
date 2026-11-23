import type { IMessage } from './IMessage/IMessage.js';
import type { IRocketChatRecord } from './IRocketChatRecord.js';

export interface IReport extends IRocketChatRecord {
	message: IMessage;
	description: string;
	ts: Date;
	userId: string;
}
