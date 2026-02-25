import * as z from 'zod';

import type { IRocketChatRecord } from './IRocketChatRecord';

export const EmojiCustomNameSchema = z.string().brand<'EmojiCustomName'>();

export type EmojiCustomName = z.infer<typeof EmojiCustomNameSchema>;

export interface IEmojiCustom extends IRocketChatRecord {
	name: EmojiCustomName;
	aliases: string[];
	extension: string;
	etag?: string;
}
