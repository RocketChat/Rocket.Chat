import type { IEmojiPackEntry } from '@rocket.chat/core-typings';
import type { TranslationKey } from '@rocket.chat/ui-contexts';

type EmojiPackage = {
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

export type EmojiPackages = {
	packages: Record<string, EmojiPackage>;
	list: Record<string, IEmojiPackEntry>;
};
