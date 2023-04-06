import { escapeRegExp } from '@rocket.chat/string-helpers';

import { emoji } from '../../../../../app/emoji/lib/rocketchat';

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
