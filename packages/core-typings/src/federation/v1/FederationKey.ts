import type { IRocketChatRecord } from '../../IRocketChatRecord';

// eslint-disable-next-line @typescript-eslint/naming-convention
export interface FederationKey extends IRocketChatRecord {
	_id: string;
	type: 'private' | 'public';
	key: string;
}
