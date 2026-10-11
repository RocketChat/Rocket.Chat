import type { IRocketChatRecord } from '../IRocketChatRecord';

export interface IControl extends IRocketChatRecord {
	version: number;
	locked: boolean;
	hash?: string;
	buildAt?: string | Date;
	lockedAt?: string | Date;
}
