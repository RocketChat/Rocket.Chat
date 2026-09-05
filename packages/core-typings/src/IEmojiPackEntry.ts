// An entry of `emoji.list`, i.e. a single renderable emoji or emoji alias registered by an emoji pack
// (native/unicode, custom, or any package added through the emoji Apps-Engine hooks).
export type INativeEmojiPackEntry = {
	name?: string;
	category: string;
	emojiPackage: string;
	shortnames: string[];
	uc_base: string;
	uc_greedy: string;
	uc_match: string;
	uc_output: string;
	aliases?: string[];
	aliasOf?: undefined;
	extension?: string;
	etag?: string;
	unicode?: string;
};

export type ICustomEmojiPackEntry = {
	name: string;
	emojiPackage: string;
	extension: string;
	aliases?: string[];
	aliasOf?: undefined;
	shortnames?: undefined;
	etag?: string;
};

export type IEmojiAliasPackEntry = {
	name?: undefined;
	emojiPackage: string;
	aliasOf: string;
	extension?: undefined;
	aliases?: undefined;
	shortnames?: undefined;
	etag?: string;
};

export type IEmojiPackEntry = INativeEmojiPackEntry | ICustomEmojiPackEntry | IEmojiAliasPackEntry;
