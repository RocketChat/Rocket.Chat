import type { IRocketChatRecord } from './IRocketChatRecord.js';

export interface ICustomEmojiDescriptor extends IRocketChatRecord {
	name: string;
	aliases: string;
	extension: string;
}
