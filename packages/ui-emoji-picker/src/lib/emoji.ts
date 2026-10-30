import { escapeRegExp } from '@rocket.chat/tools';
import type { TranslationKey } from '@rocket.chat/ui-contexts';

import type { EmojiCategory, EmojiItem } from './types';
import type { EmojiPackages } from '../contexts/EmojiRegistryContext';

export const CUSTOM_CATEGORY = 'rocket';
export const CUSTOM_CATEGORY_CLASSNAME = 'emojipicker--custom';

const MIXED_TONE_SUFFIX = /_tone([1-5])-[1-5]$/;

export type RowItem = Array<EmojiItem & { category: string }>;
export type RowDivider = { category: string; i18n: TranslationKey };
export type LoadMoreItem = { loadMore: true };
export type EmojiPickerItem = RowItem | RowDivider | LoadMoreItem;

export type CategoriesIndexes = { key: string; index: number }[];

export const isRowDivider = (item: EmojiPickerItem): item is RowDivider => 'i18n' in item;
export const isLoadMore = (item: EmojiPickerItem): item is LoadMoreItem => 'loadMore' in item;

export const getCategoriesList = (registry: EmojiPackages) => {
	let categoriesList: EmojiCategory[] = [];

	for (const emojiPackage of Object.values(registry.packages)) {
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
	registry: EmojiPackages,
	searchTerm: string,
	actualTone: number,
	recentEmojis: string[],
	setRecentEmojis: (emojis: string[]) => void,
) => {
	const emojis = [];
	const seenEmojis = new Set<(typeof registry.list)[string]>();
	const searchRegExp = new RegExp(escapeRegExp(searchTerm.replace(/:/g, '')), 'i');

	for (let current in registry.list) {
		if (!registry.list.hasOwnProperty(current) || !searchRegExp.test(current)) {
			continue;
		}

		const emojiObject = registry.list[current];

		// Skip duplicates (same emoji in different packages)
		if (seenEmojis.has(emojiObject)) {
			continue;
		}

		const { emojiPackage, shortnames = [], name } = emojiObject;
		let tone = '';
		current = current.replace(/:/g, '');

		if (actualTone > 0 && registry.packages[emojiPackage].toneList.hasOwnProperty(name ?? current)) {
			tone = `_tone${actualTone}`;
		}

		const isNative = emojiPackage === 'native';
		if (isNative) {
			const mixedTones = current.match(MIXED_TONE_SUFFIX);
			if (mixedTones && !(actualTone > 0 && Number(mixedTones[1]) === actualTone)) {
				continue;
			}
		}

		const categoryName = isNative ? current.replace(MIXED_TONE_SUFFIX, '') : current;

		const isCategoryEmoji = Object.values(registry.packages[emojiPackage].emojisByCategory).some(
			(contents) => contents.indexOf(categoryName) !== -1,
		);
		if (!isCategoryEmoji && shortnames.length === 0) {
			continue;
		}

		const emojiToRender = `:${current}${tone}:`;

		const actualEmoji = registry.list[emojiToRender];
		if (!actualEmoji) {
			removeFromRecent(emojiToRender, recentEmojis, setRecentEmojis);
			continue;
		}

		seenEmojis.add(emojiObject);

		const actualPackage = actualEmoji.emojiPackage;

		emojis.push({ emoji: `${current}${tone}`, image: registry.packages[actualPackage].renderPicker(emojiToRender) });
	}

	return emojis;
};

export const removeFromRecent = (emoji: string, recentEmojis: string[], setRecentEmojis?: (emojis: string[]) => void) => {
	const _emoji = emoji.replace(/(^:|:$)/g, '');
	const pos = recentEmojis.indexOf(_emoji);

	if (pos === -1) {
		return;
	}
	recentEmojis.splice(pos, 1);
	setRecentEmojis?.(recentEmojis);
};
