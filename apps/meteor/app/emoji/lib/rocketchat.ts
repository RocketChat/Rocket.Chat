import type { TranslationKey } from '@rocket.chat/ui-contexts';

export type EmojiPackage = {
	emojiCategories: Array<{ key: string; i18n: TranslationKey }>;
	categoryIndex?: number;
	emojisByCategory: Record<string, string[]>;
	toneList: Record<string, unknown>;
	render: (message: string) => string;
	renderPicker: (emojiToRender: string) => string | undefined;
	ascii?: boolean;
	sprites?: unknown;
};

export type EmojiPackages = {
	packages: {
		[key: string]: EmojiPackage;
	};
	list: {
		[key: keyof NonNullable<EmojiPackages['packages']>]: {
			category: string;
			emojiPackage: string;
			shortnames: string[];
			uc_base: string;
			uc_greedy: string;
			uc_match: string;
			uc_output: string;
		};
	};
};
