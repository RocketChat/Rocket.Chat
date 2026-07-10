import type { IRocketChatRecord } from './IRocketChatRecord';

export interface IOEmbedCache extends IRocketChatRecord {
	data: any;
	updatedAt: Date; // TODO: this field name differs from `_updatedAt` on `IRocketChatRecord`, should we unify this?
}
