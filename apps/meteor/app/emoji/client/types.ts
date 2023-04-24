import type { TranslationKey } from '@rocket.chat/ui-contexts';

export type EmojiItem = {
	emoji: string;
	image: string;
};

export type EmojiCategories = {
	key: string;
	i18n: TranslationKey;
};

type EmojiPackage = {
	emojiCategories: EmojiCategories[];
	categoryIndex: number;
	emojisByCategory: {
		[key: string]: string[];
	};
	toneList: {
		[key: string]: number;
	};
	render: (message: any) => string;
	renderPicker(emojiToRender: string): string;
};

export type EmojiPackages = {
	[packageName: string]: EmojiPackage;
};

export type EmojiType = {
	packages: EmojiPackages;
	list: {
		[key: string]: {
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
