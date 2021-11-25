import { IRocketChatRecord } from './IRocketChatRecord';

export interface ICustomEmojiDescriptor extends IRocketChatRecord {
	name: string;
	aliases: string[];
	extension: string;
}
