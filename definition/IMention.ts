import { IRocketChatRecord } from './IRocketChatRecord';

export type MentionKind = 'user' | 'here' | 'all' | 'highlight';

export interface IMention extends IRocketChatRecord {
	uid: string;
	messageId: string;
	rid: string;
	kind: MentionKind;
	ts: Date;
}
