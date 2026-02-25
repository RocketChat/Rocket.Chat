import type { IRocketChatRecord } from './IRocketChatRecord';
import type { Branded } from './utils';

export type EmojiCustomName = Branded<string, 'EmojiCustomName'>;

export interface IEmojiCustom extends IRocketChatRecord {
	name: EmojiCustomName;
	aliases: string[];
	extension: string;
	etag?: string;
}
