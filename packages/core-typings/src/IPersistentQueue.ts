import type { IRocketChatRecord } from './IRocketChatRecord';

export interface IPersistentQueue extends IRocketChatRecord {
	type: string;
	rejectedTime: Date;
	nextReceivableTime: Date;
	receivedTime: Date;
}
