import { escapeRegExp } from '@rocket.chat/string-helpers';

import { emoji } from '../lib/rocketchat';

export const createEmojiList = (category: string, actualTone: number | null) => {
	const emojiList = [];
	const emojiPackages = Object.values(emoji.packages);
	emojiPackages.forEach((emojiPackage) => {
		if (!emojiPackage.emojisByCategory || !emojiPackage.emojisByCategory[category]) {
			return;
		}

		const total = emojiPackage.emojisByCategory[category].length;
		// const listTotal = limit ? Math.min(limit, total) : total;

		for (let i = 0; i < total; i++) {
			const current = emojiPackage.emojisByCategory[category][i];

			const tone = actualTone && actualTone > 0 && emojiPackage.toneList.hasOwnProperty(current) ? `_tone${actualTone}` : '';
			emojiList.push({ emoji: current, image: emojiPackage.renderPicker(`:${current}${tone}:`) });
		}
	});

	return emojiList;
};

export const getCategoriesList = () => {
	let categoriesList = [];

	for (const emojiPackage in emoji.packages) {
		if (emoji.packages.hasOwnProperty(emojiPackage)) {
			if (emoji.packages[emojiPackage].emojiCategories) {
				if (typeof emoji.packages[emojiPackage].categoryIndex !== 'undefined') {
					categoriesList.splice(emoji.packages[emojiPackage].categoryIndex, 0, ...emoji.packages[emojiPackage].emojiCategories);
				} else {
					categoriesList = categoriesList.concat(emoji.packages[emojiPackage].emojiCategories);
				}
			}
		}
	}

	return categoriesList;
};

export const getEmojisBySearchTerm = (searchTerm: string, actualTone: number) => {
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

			if (actualTone > 0 && emoji.packages[emojiPackage].toneList.hasOwnProperty(emoji)) {
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
				emojis.push({ emoji: current, image: emoji.packages[emojiPackage].renderPicker(`:${current}${tone}:`) });
			}
		}
	}

	return emojis;
};

export const updateRecent = (recentList: string[]) => {
	const recentPkgList: string[] = emoji.packages.base.emojisByCategory.recent;
	recentList?.forEach((_emoji) => {
		!recentPkgList.includes(_emoji) && recentPkgList.push(_emoji);
	});
};
