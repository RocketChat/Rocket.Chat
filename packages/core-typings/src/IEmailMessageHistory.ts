import type { IRocketChatRecord } from './IRocketChatRecord';

export interface IEmailMessageHistory extends IRocketChatRecord {
	email: string;
	createdAt?: Date;
}
