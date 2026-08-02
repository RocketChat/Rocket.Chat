/** Common emoji entry fields. */

interface IEmojiBase {
	emojiPackage: string;
}

/**
 * Native emoji from emoji packages (like emojione, noto, etc.)
 */
export interface INativeEmoji extends IEmojiBase {
	category: string;
	shortnames: string[];
	uc_base: string;
	uc_greedy: string;
	uc_match: string;
	uc_output: string;
	aliases?: string[];
	unicode?: string;
}

/**
 * Alias entry pointing to another emoji
 */
export interface IEmojiAlias extends IEmojiBase {
	aliasOf: string;
	etag?: string;
}

/**
 * Custom emoji entry in the emoji list
 */
export interface ICustomEmojiListEntry extends IEmojiBase {
	name: string;
	aliases: string[];
	extension: string;
	etag?: string;
}

/**
 * Union type for all possible emoji list entries
 */
export type IEmoji = INativeEmoji | IEmojiAlias | ICustomEmojiListEntry;
