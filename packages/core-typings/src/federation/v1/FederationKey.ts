import type { IRocketChatRecord } from '../../IRocketChatRecord';

export interface FederationKey extends IRocketChatRecord {
	_id: string;
	type: 'private' | 'public';
	key: string;
}
