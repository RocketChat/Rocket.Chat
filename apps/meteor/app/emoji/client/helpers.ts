import { escapeRegExp } from '@rocket.chat/string-helpers';

import type { EmojiCategory, EmojiItem } from '.';
import { emoji } from './lib';

export const CUSTOM_CATEGORY = 'rocket';

export const createPickerEmojis = (
	customItemsLimit: number,
	actualTone: number,
	recentEmojis: string[],
	setRecentEmojis: (emojis: string[]) => void,
) => {
	const categories = getCategoriesList();

	const mappedCategories = categories.map((category) => ({
		key: category.key,
		i18n: category.i18n,
		emojis: {
			list: createEmojiList(category.key, actualTone, recentEmojis, setRecentEmojis),
			limit: category.key === CUSTOM_CATEGORY ? customItemsLimit : null,
		},
	}));

	return mappedCategories;
};

export const createEmojiList = (
	category: string,
	actualTone: number | null,
	recentEmojis: string[],
	setRecentEmojis: (emojis: string[]) => void,
) => {
	const emojiList: EmojiItem[] = [];
	const emojiPackages = Object.values(emoji.packages);

	emojiPackages.forEach((emojiPackage) => {
		if (!emojiPackage.emojisByCategory?.[category]) {
			return;
		}

		const total = emojiPackage.emojisByCategory[category].length;

		for (let i = 0; i < total; i++) {
			const current = emojiPackage.emojisByCategory[category][i];

			const tone = actualTone && actualTone > 0 && emojiPackage.toneList.hasOwnProperty(current) ? `_tone${actualTone}` : '';

			const emojiToRender = `:${current}${tone}:`;

			if (!emoji.list[emojiToRender]) {
				removeFromRecent(emojiToRender, recentEmojis, setRecentEmojis);
				return;
			}

			const image = emojiPackage.renderPicker(emojiToRender);
			if (!image) {
				continue;
			}
			emojiList.push({ emoji: current, image });
		}
	});

	return emojiList;
};

export const getCategoriesList = () => {
	let categoriesList: EmojiCategory[] = [];

	for (const emojiPackage of Object.values(emoji.packages)) {
		if (emojiPackage.emojiCategories) {
			if (typeof emojiPackage.categoryIndex !== 'undefined') {
				categoriesList.splice(emojiPackage.categoryIndex, 0, ...emojiPackage.emojiCategories);
			} else {
				categoriesList = categoriesList.concat(emojiPackage.emojiCategories);
			}
		}
	}

	const rocketPosition = categoriesList.findIndex((category) => category.key === CUSTOM_CATEGORY);
	const rocketCategory = categoriesList.splice(rocketPosition, 1)[0];
	categoriesList.push(rocketCategory);

	return categoriesList;
};

export const getEmojisBySearchTerm = (
	searchTerm: string,
	actualTone: number,
	recentEmojis: string[],
	setRecentEmojis: (emojis: string[]) => void,
) => {
	const emojis = [];
	const searchRegExp = new RegExp(escapeRegExp(searchTerm.replace(/:/g, '')), 'i');

	for (let current in emoji.list) {
		if (!emoji.list.hasOwnProperty(current)) {
			continue;
		}

		if (searchRegExp.test(current)) {
			const emojiObject = emoji.list[current];
			const { emojiPackage, shortnames = [] } = emojiObject;
			let tone = '';
			current = current.replace(/:/g, '');
			const alias = shortnames[0] !== undefined ? shortnames[0].replace(/:/g, '') : shortnames[0];

			if (actualTone > 0 && emoji.packages[emojiPackage].toneList.hasOwnProperty(current)) {
				tone = `_tone${actualTone}`;
			}

			let emojiFound = false;

			for (const key in emoji.packages[emojiPackage].emojisByCategory) {
				if (emoji.packages[emojiPackage].emojisByCategory.hasOwnProperty(key)) {
					const contents = emoji.packages[emojiPackage].emojisByCategory[key];
					const searchValArray = alias !== undefined ? alias.replace(/:/g, '').split('_') : alias;
					if (contents.indexOf(current) !== -1 || searchValArray?.includes(searchTerm)) {
						emojiFound = true;
						break;
					}
				}
			}

			if (emojiFound) {
				const emojiToRender = `:${current}${tone}:`;

				if (!emoji.list[emojiToRender]) {
					removeFromRecent(emojiToRender, recentEmojis, setRecentEmojis);
					break;
				}

				emojis.push({ emoji: current, image: emoji.packages[emojiPackage].renderPicker(emojiToRender) });
			}
		}
	}

	return emojis;
};

export const removeFromRecent = (emoji: string, recentEmojis: string[], setRecentEmojis: (emojis: string[]) => void) => {
	const _emoji = emoji.replace(/(^:|:$)/g, '');
	const pos = recentEmojis.indexOf(_emoji as never);

	if (pos === -1) {
		return;
	}
	recentEmojis.splice(pos, 1);
	setRecentEmojis(recentEmojis);
};

export const updateRecent = (recentList: string[]) => {
	const recentPkgList: string[] = emoji.packages.base.emojisByCategory.recent;
	recentList?.forEach((_emoji) => {
		!recentPkgList.includes(_emoji) && recentPkgList.push(_emoji);
	});
};

const getEmojiRender = (emojiName: string) => {
	const emojiPackageName = emoji.list[emojiName]?.emojiPackage;
	const emojiPackage = emoji.packages[emojiPackageName];
	return emojiPackage?.render(emojiName);
};

export const getFrequentEmoji = (frequentEmoji: string[]) => {
	return frequentEmoji?.map((frequentEmoji) => {
		return { emoji: frequentEmoji, image: getEmojiRender(`:${frequentEmoji}:`) };
	});
};
