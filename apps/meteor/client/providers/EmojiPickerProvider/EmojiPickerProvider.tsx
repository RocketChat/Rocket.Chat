import { useDebouncedState, useEffectEvent, useLocalStorage } from '@rocket.chat/fuselage-hooks';
import type { ReactNode, ReactElement, ContextType } from 'react';
import { useState, useCallback, useMemo, useSyncExternalStore } from 'react';

import { useUpdateCustomEmoji } from './useUpdateCustomEmoji';
import { emoji, getFrequentEmoji, createEmojiListByCategorySubscription } from '../../../app/emoji/client';
import { EmojiPickerContext } from '../../contexts/EmojiPickerContext';
import EmojiPicker from '../../views/composer/EmojiPicker/EmojiPicker';

const DEFAULT_ITEMS_LIMIT = 90;

// limit recent emojis to 27 (3 rows of 9)
const RECENT_EMOJIS_LIMIT = 27;

const EmojiPickerProvider = ({ children }: { children: ReactNode }): ReactElement => {
	const [emojiPicker, setEmojiPicker] = useState<ReactElement | null>(null);
	const [emojiToPreview, setEmojiToPreview] = useDebouncedState<{ emoji: string; name: string } | null>(null, 100);
	const [recentEmojis, setRecentEmojis] = useLocalStorage<string[]>('emoji.recent', []);
	const [frequentEmojis, setFrequentEmojis] = useLocalStorage<[string, number][]>('emoji.frequent', []);

	const [actualTone, setActualTone] = useLocalStorage('emoji.tone', 0);
	const [currentCategory, setCurrentCategory] = useState('recent');

	const [customItemsLimit, setCustomItemsLimit] = useState(DEFAULT_ITEMS_LIMIT);

	const [quickReactions, _setQuickReactions] = useState<{ emoji: string; image: string }[]>(() =>
		getFrequentEmoji(frequentEmojis.map(([emoji]) => emoji)),
	);

	const setQuickReactions = useEffectEvent(() => _setQuickReactions(getFrequentEmoji(frequentEmojis.map(([emoji]) => emoji))));
	const [sub, getSnapshot] = useMemo(() => {
		return createEmojiListByCategorySubscription(customItemsLimit, actualTone, recentEmojis, setRecentEmojis, setQuickReactions);
	}, [customItemsLimit, actualTone, recentEmojis, setRecentEmojis, setQuickReactions]);

	const [emojiListByCategory, categoriesIndexes] = useSyncExternalStore(sub, getSnapshot);

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
			_setQuickReactions(getFrequentEmoji(sortedFrequent.map(([emoji]) => emoji)));
		},
		[frequentEmojis, setFrequentEmojis],
	);

	const addRecentEmoji = useCallback(
		(_emoji: string) => {
			addFrequentEmojis(_emoji);

			const recent = recentEmojis || [];
			const pos = recent.indexOf(_emoji as never);

			if (pos !== -1) {
				recent.splice(pos, 1);
			}

			recent.unshift(_emoji);

			recent.splice(RECENT_EMOJIS_LIMIT);

			// If this value is not cloned, the recent list will not be updated
			setRecentEmojis([...recent]);
			emoji.packages.base.emojisByCategory.recent = recent;
		},
		[recentEmojis, setRecentEmojis, addFrequentEmojis],
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
			emojiListByCategory,
			recentEmojis,
			setRecentEmojis,
			actualTone,
			currentCategory,
			setCurrentCategory,
			categoriesIndexes,
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
			emojiListByCategory,
			categoriesIndexes,
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
