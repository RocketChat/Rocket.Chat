import type { IRocketChatRecord } from './IRocketChatRecord';

export interface IEmojiCustom extends IRocketChatRecord {
	name: string;
	aliases: string;
	extension: string;
}
