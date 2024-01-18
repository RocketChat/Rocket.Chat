import { useDebouncedState, useLocalStorage } from '@rocket.chat/fuselage-hooks';
import type { ReactNode, ReactElement, ContextType } from 'react';
import React, { useState, useCallback, useMemo, useEffect } from 'react';

import type { EmojiByCategory } from '../../../app/emoji/client';
import { emoji, getFrequentEmoji, updateRecent, createEmojiList, createPickerEmojis, CUSTOM_CATEGORY } from '../../../app/emoji/client';
import { EmojiPickerContext } from '../../contexts/EmojiPickerContext';
import EmojiPicker from '../../views/composer/EmojiPicker/EmojiPicker';
import { useUpdateCustomEmoji } from './useUpdateCustomEmoji';

const DEFAULT_ITEMS_LIMIT = 90;

const EmojiPickerProvider = ({ children }: { children: ReactNode }): ReactElement => {
	const [emojiPicker, setEmojiPicker] = useState<ReactElement | null>(null);
	const [emojiToPreview, setEmojiToPreview] = useDebouncedState<{ emoji: string; name: string } | null>(null, 100);
	const [recentEmojis, setRecentEmojis] = useLocalStorage<string[]>('emoji.recent', []);
	const [actualTone, setActualTone] = useLocalStorage('emoji.tone', 0);
	const [currentCategory, setCurrentCategory] = useState('recent');
	const [customItemsLimit, setCustomItemsLimit] = useState(DEFAULT_ITEMS_LIMIT);

	const [frequentEmojis, setFrequentEmojis] = useLocalStorage<[string, number][]>('emoji.frequent', []);

	const [quickReactions, setQuickReactions] = useState<{ emoji: string; image: string }[]>(() =>
		getFrequentEmoji(frequentEmojis.map(([emoji]) => emoji)),
	);

	useUpdateCustomEmoji();

	const addFrequentEmojis = useCallback(
		(emoji: string) => {
			const empty: [string, number][] = frequentEmojis.some(([emojiName]) => emojiName === emoji) ? [] : [[emoji, 0]];

			const sortedFrequent = [...empty, ...frequentEmojis]
				.map(([emojiName, count]) => {
					return (emojiName === emoji ? [emojiName, Math.min(count + 5, 100)] : [emojiName, Math.max(count - 1, 0)]) as [string, number];
				})
				.sort(([, frequentA], [, frequentB]) => frequentB - frequentA);

			setFrequentEmojis(sortedFrequent);
			setQuickReactions(getFrequentEmoji(sortedFrequent.map(([emoji]) => emoji)));
		},
		[frequentEmojis, setFrequentEmojis],
	);

	const [getEmojiListsByCategory, setEmojiListsByCategoryGetter] = useState<() => EmojiByCategory[]>(() => () => []);

	// TODO: improve this update
	const updateEmojiListByCategory = useCallback(
		(categoryKey: string, limit: number = DEFAULT_ITEMS_LIMIT) => {
			setEmojiListsByCategoryGetter(
				(getEmojiListsByCategory) => () =>
					getEmojiListsByCategory().map((category) =>
						categoryKey === category.key
							? {
									...category,
									emojis: {
										list: createEmojiList(category.key, null, recentEmojis, setRecentEmojis),
										limit: category.key === CUSTOM_CATEGORY ? limit | customItemsLimit : null,
									},
							  }
							: category,
					),
			);
		},
		[customItemsLimit, recentEmojis, setRecentEmojis],
	);

	useEffect(() => {
		if (recentEmojis?.length > 0) {
			updateRecent(recentEmojis);
		}

		setEmojiListsByCategoryGetter(() => () => createPickerEmojis(customItemsLimit, actualTone, recentEmojis, setRecentEmojis));
	}, [actualTone, recentEmojis, customItemsLimit, currentCategory, setRecentEmojis, frequentEmojis]);

	const addRecentEmoji = useCallback(
		(_emoji: string) => {
			addFrequentEmojis(_emoji);

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
		[recentEmojis, setRecentEmojis, updateEmojiListByCategory, addFrequentEmojis],
	);

	const open = useCallback((ref: Element, callback: (emoji: string) => void) => {
		return setEmojiPicker(<EmojiPicker reference={ref} onClose={() => setEmojiPicker(null)} onPickEmoji={(emoji) => callback(emoji)} />);
	}, []);

	const handlePreview = useCallback((emoji: string, name: string) => setEmojiToPreview({ emoji, name }), [setEmojiToPreview]);

	const handleRemovePreview = useCallback(() => setEmojiToPreview(null), [setEmojiToPreview]);

	const contextValue = useMemo(
		(): ContextType<typeof EmojiPickerContext> => ({
			isOpen: emojiPicker !== null,
			close: () => setEmojiPicker(null),
			open,
			emojiToPreview,
			handlePreview,
			handleRemovePreview,
			addRecentEmoji,
			getEmojiListsByCategory,
			recentEmojis,
			setRecentEmojis,
			actualTone,
			currentCategory,
			setCurrentCategory,
			customItemsLimit,
			setCustomItemsLimit,
			setActualTone,
			quickReactions,
		}),
		[
			emojiPicker,
			open,
			emojiToPreview,
			addRecentEmoji,
			getEmojiListsByCategory,
			recentEmojis,
			setRecentEmojis,
			actualTone,
			currentCategory,
			setCurrentCategory,
			customItemsLimit,
			setActualTone,
			quickReactions,
			handlePreview,
			handleRemovePreview,
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
