import { useDebouncedState, useLocalStorage } from '@rocket.chat/fuselage-hooks';
import type { ReactNode, ReactElement } from 'react';
import React, { useState, useCallback, useMemo, useEffect } from 'react';

import type { EmojiByCategory } from '../../app/emoji/client';
import { emoji, updateRecent, createEmojiList, createPickerEmojis, CUSTOM_CATEGORY } from '../../app/emoji/client';
import { EmojiPickerContext } from '../contexts/EmojiPickerContext';
import EmojiPicker from '../views/composer/EmojiPicker/EmojiPicker';

const DEFAULT_ITEMS_LIMIT = 90;

const EmojiPickerProvider = ({ children }: { children: ReactNode }): ReactElement => {
	const [emojiPicker, setEmojiPicker] = useState<ReactElement | null>(null);
	const [emojiToPreview, setEmojiToPreview] = useDebouncedState<{ emoji: string; name: string } | null>(null, 100);
	const [recentEmojis, setRecentEmojis] = useLocalStorage<string[]>('emoji.recent', []);
	const [actualTone, setActualTone] = useLocalStorage('emoji.tone', 0);
	const [emojiListByCategory, setEmojiListByCategory] = useState<EmojiByCategory[]>([]);
	const [currentCategory, setCurrentCategory] = useState('recent');
	const [customItemsLimit, setCustomItemsLimit] = useState(DEFAULT_ITEMS_LIMIT);

	// TODO: improve this update
	const updateEmojiListByCategory = useCallback(
		(categoryKey: string, limit: number = DEFAULT_ITEMS_LIMIT) => {
			const result = emojiListByCategory.map((category) => {
				return categoryKey === category.key
					? {
							...category,
							emojis: {
								list: createEmojiList(category.key, null, recentEmojis, setRecentEmojis),
								limit: category.key === CUSTOM_CATEGORY ? limit | customItemsLimit : null,
							},
					  }
					: category;
			});

			setEmojiListByCategory(result);
		},
		[customItemsLimit, emojiListByCategory, recentEmojis, setRecentEmojis],
	);

	const addRecentEmoji = useCallback(
		(_emoji: string) => {
			const recent = recentEmojis || [];
			const pos = recent.indexOf(_emoji as never);

			if (pos !== -1) {
				recent.splice(pos, 1);
			}

			recent.unshift(_emoji);

			// limit recent emojis to 27 (3 rows of 9)
			recent.splice(27);

			setRecentEmojis(recent);
			emoji.packages.base.emojisByCategory.recent = recent;
			updateEmojiListByCategory('recent');
		},
		[recentEmojis, setRecentEmojis, updateEmojiListByCategory],
	);

	useEffect(() => {
		if (recentEmojis?.length > 0) {
			updateRecent(recentEmojis);
		}

		const emojis = createPickerEmojis(customItemsLimit, actualTone, recentEmojis, setRecentEmojis);
		setEmojiListByCategory(emojis);
	}, [actualTone, recentEmojis, customItemsLimit, currentCategory, setRecentEmojis]);

	const open = useCallback((ref: Element, callback: (emoji: string) => void) => {
		return setEmojiPicker(<EmojiPicker reference={ref} onClose={() => setEmojiPicker(null)} onPickEmoji={(emoji) => callback(emoji)} />);
	}, []);

	const contextValue = useMemo(
		() => ({
			isOpen: emojiPicker !== null,
			close: () => setEmojiPicker(null),
			open,
			emojiToPreview,
			handlePreview: (emoji: string, name: string) => setEmojiToPreview({ emoji, name }),
			handleRemovePreview: () => setEmojiToPreview(null),
			addRecentEmoji,
			emojiListByCategory,
			recentEmojis,
			setRecentEmojis,
			actualTone,
			currentCategory,
			setCurrentCategory,
			customItemsLimit,
			setCustomItemsLimit,
			setActualTone,
		}),
		[
			emojiPicker,
			open,
			emojiToPreview,
			setEmojiToPreview,
			addRecentEmoji,
			emojiListByCategory,
			recentEmojis,
			setRecentEmojis,
			actualTone,
			currentCategory,
			setCurrentCategory,
			customItemsLimit,
			setActualTone,
		],
	);

	return (
		<EmojiPickerContext.Provider value={contextValue}>
			{children}
			{emojiPicker}
		</EmojiPickerContext.Provider>
	);
};

export default EmojiPickerProvider;
