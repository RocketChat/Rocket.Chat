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
	list?: string[];
	_regexpSignature?: string | null;
	_regexp?: RegExp | null;
};

/** An emoji provided by a native (unicode) emoji package */
export type NativeEmojiListEntry = {
	category: string;
	emojiPackage: 'native';
	shortnames: string[];
	uc_base: string;
	uc_greedy: string;
	uc_match: string;
	uc_output: string;
	aliases?: string[];
	aliasOf?: undefined;
	extension?: undefined;
	etag?: undefined;
	unicode?: string;
};

/** A custom emoji uploaded by an admin; overrides a native emoji with the same name */
export type CustomEmojiListEntry = IEmoji & {
	emojiPackage: 'emojiCustom';
	aliasOf?: undefined;
	shortnames?: undefined;
	unicode?: undefined;
};

/** A shortname that resolves to another emoji */
export type EmojiAliasListEntry = {
	emojiPackage: 'emojiCustom';
	aliasOf: string;
	extension?: undefined;
	aliases?: undefined;
	shortnames?: undefined;
	etag?: undefined;
	unicode?: undefined;
};

export type EmojiListEntry = NativeEmojiListEntry | CustomEmojiListEntry | EmojiAliasListEntry;

export type EmojiPackages = {
	packages: {
		[key: string]: EmojiPackage;
	};
	list: {
		[key: string]: EmojiListEntry;
	};
};
