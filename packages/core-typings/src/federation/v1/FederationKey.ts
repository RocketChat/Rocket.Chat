import type { IRocketChatRecord } from '../../IRocketChatRecord.js';

export interface FederationKey extends IRocketChatRecord {
	_id: string;
	type: 'private' | 'public';
	key: string;
}
