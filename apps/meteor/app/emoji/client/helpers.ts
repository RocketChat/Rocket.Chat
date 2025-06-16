import { escapeRegExp } from '@rocket.chat/string-helpers';
import type { TranslationKey } from '@rocket.chat/ui-contexts';

import type { EmojiCategory, EmojiItem } from '.';
import { emoji, emojiEmitter } from './lib';

export const CUSTOM_CATEGORY = 'rocket';

type RowItem = Array<EmojiItem & { category: string }>;
type RowDivider = { category: string; i18n: TranslationKey };
type LoadMoreItem = { loadMore: true };
export type EmojiPickerItem = RowItem | RowDivider | LoadMoreItem;

export type CategoriesIndexes = { key: string; index: number }[];

export const isRowDivider = (item: EmojiPickerItem): item is RowDivider => 'i18n' in item;
export const isLoadMore = (item: EmojiPickerItem): item is LoadMoreItem => 'loadMore' in item;

export const createEmojiListByCategorySubscription = (
	customItemsLimit: number,
	actualTone: number,
	recentEmojis: string[],
	setRecentEmojis: (emojis: string[]) => void,
	setQuickReactions: () => void,
): [subscribe: (onStoreChange: () => void) => () => void, getSnapshot: () => ReturnType<typeof createPickerEmojis>] => {
	let result: ReturnType<typeof createPickerEmojis> = [[], []];
	updateRecent(recentEmojis);

	const sub = (cb: () => void) => {
		result = createPickerEmojis(customItemsLimit, actualTone, recentEmojis, setRecentEmojis);
		setQuickReactions();
		return emojiEmitter.on('updated', () => {
			result = createPickerEmojis(customItemsLimit, actualTone, recentEmojis, setRecentEmojis);
			setQuickReactions();
			cb();
		});
	};

	return [sub, () => result];
};

export const createPickerEmojis = (
	customItemsLimit: number,
	actualTone: number,
	recentEmojis: string[],
	setRecentEmojis: (emojis: string[]) => void,
): [EmojiPickerItem[], CategoriesIndexes] => {
	const categories = getCategoriesList();
	const categoriesIndexes: CategoriesIndexes = [];

	const mappedCategories = categories.reduce<EmojiPickerItem[]>((acc, category) => {
		categoriesIndexes.push({ key: category.key, index: acc.length });
		acc.push({ category: category.key, i18n: category.i18n });
		acc.push(...createEmojiList(customItemsLimit, category.key, actualTone, recentEmojis, setRecentEmojis));
		return acc;
	}, []);

	return [mappedCategories, categoriesIndexes];
};

export const createEmojiList = (
	customItemsLimit: number,
	category: string,
	actualTone: number | null,
	recentEmojis: string[],
	setRecentEmojis: (emojis: string[]) => void,
): (RowItem | LoadMoreItem)[] => {
	const items: RowItem = [];
	const emojiPackages = Object.values(emoji.packages);
	let count = 0;
	let limited = false;

	emojiPackages.forEach((emojiPackage) => {
		if (!emojiPackage.emojisByCategory?.[category]) {
			return;
		}
		const _total = emojiPackage.emojisByCategory[category].length;
		const total = category === CUSTOM_CATEGORY ? customItemsLimit - count : _total;
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
			items.push({ emoji: current, image, category });
			count++;
		}

		if (_total > total) {
			limited = true;
		}
	});

	const rowCount = 9;
	const rowList: Array<RowItem | LoadMoreItem> = Array.from({ length: Math.ceil(items.length / rowCount) }).map(() => []);

	for (let i = 0; i < rowList.length; i++) {
		const row = items.slice(i * rowCount, i * rowCount + rowCount);
		rowList[i] = row;
	}

	if (rowList.length === 0) {
		rowList.push([]);
	}

	if (limited) {
		rowList.push({ loadMore: true });
	}

	return rowList;
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

export const removeFromRecent = (emoji: string, recentEmojis: string[], setRecentEmojis?: (emojis: string[]) => void) => {
	const _emoji = emoji.replace(/(^:|:$)/g, '');
	const pos = recentEmojis.indexOf(_emoji as never);

	if (pos === -1) {
		return;
	}
	recentEmojis.splice(pos, 1);
	setRecentEmojis?.(recentEmojis);
};

// There's no need to dispatchUpdate here. This helper is called before the list is generated.
// This means that the recent list will always be up to date by the time it is used.
export const updateRecent = (recentList: string[]) => {
	const recentPkgList: string[] = emoji.packages.base.emojisByCategory.recent;
	recentList?.forEach((_emoji) => {
		!recentPkgList.includes(_emoji) && recentPkgList.push(_emoji);
	});
};

export const replaceEmojiInRecent = ({ oldEmoji, newEmoji }: { oldEmoji: string; newEmoji: string }) => {
	const recentPkgList: string[] = emoji.packages.base.emojisByCategory.recent;
	const pos = recentPkgList.indexOf(oldEmoji);

	if (pos !== -1) {
		recentPkgList[pos] = newEmoji;
		emoji.dispatchUpdate();
	}
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
