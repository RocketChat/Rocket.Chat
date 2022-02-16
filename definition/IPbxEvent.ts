import { IRocketChatRecord } from './IRocketChatRecord';

export interface IPbxEvent extends IRocketChatRecord {
	uniqueId: string;
	event: string;
	phone: string; // calleridnum
	queue: string; // queue
	ts: Date; // the moment when event happened
	holdTime?: string;
	callUniqueId: string;
}
