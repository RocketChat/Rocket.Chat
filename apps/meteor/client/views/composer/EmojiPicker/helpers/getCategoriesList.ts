import { emoji } from '../../../../../app/emoji/lib/rocketchat';

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
