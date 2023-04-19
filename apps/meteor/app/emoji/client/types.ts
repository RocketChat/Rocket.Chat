import type { TranslationKey } from '@rocket.chat/ui-contexts';

export type EmojiItemType = {
	emoji: string;
	image: string;
};

export type EmojiCategoriesType = {
	key: string;
	i18n: TranslationKey;
};

type EmojiPackageType = {
	emojiCategories: EmojiCategoriesType[];
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

export type EmojiType = {
	packages: {
		[key: string]: EmojiPackageType;
	};
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
