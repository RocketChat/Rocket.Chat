import type { IRocketChatRecord } from './IRocketChatRecord.js';

export interface IEmojiCustom extends IRocketChatRecord {
	name: string;
	aliases: string[];
	extension: string;
	etag?: string;
}
