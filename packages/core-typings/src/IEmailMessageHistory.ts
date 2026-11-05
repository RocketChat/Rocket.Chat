import type { IRocketChatRecord } from './IRocketChatRecord.js';

export interface IEmailMessageHistory extends IRocketChatRecord {
	email: string;
	createdAt?: Date;
}
