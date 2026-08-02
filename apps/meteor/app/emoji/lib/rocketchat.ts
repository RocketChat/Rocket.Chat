import type { IEmoji } from '@rocket.chat/core-typings';
import type { TranslationKey } from '@rocket.chat/ui-contexts';

export type EmojiPackage = {
	emojiCategories: Array<{ key: string; i18n: TranslationKey }>;
	categoryIndex?: number;
	emojisByCategory: Record<string, string[]>;
	toneList: Record<string, unknown>;
	render: (message: string) => string;
	renderPicker: (emojiToRender: string) => string | undefined;
	sprites?: unknown;
	ascii?: boolean;
	list?: string[];
	_regexpSignature?: string | null;
	_regexp?: RegExp | null;
};

/**
 * Standardized emoji packages structure
 * Uses IEmoji union type for type-safe emoji list entries
 */
export type EmojiPackages = {
	packages: {
		[key: string]: EmojiPackage;
	};
	list: Record<string, IEmoji>;
};
