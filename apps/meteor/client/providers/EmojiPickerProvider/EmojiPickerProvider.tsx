import { useDebouncedState, useStableCallback, useLocalStorage } from '@rocket.chat/fuselage-hooks';
import { useRoute } from '@rocket.chat/ui-contexts';
import { EmojiPicker, EmojiPickerContext, EmojiRegistryContext } from '@rocket.chat/ui-emoji-picker';
import type { ReactNode, ContextType } from 'react';
import { Suspense, useState, useCallback, useMemo, useRef, useSyncExternalStore } from 'react';

import { useUpdateCustomEmoji } from './useUpdateCustomEmoji';
import { emoji, getFrequentEmoji, createEmojiListByCategorySubscription } from '../../lib/emoji';

const DEFAULT_ITEMS_LIMIT = 90;

// limit recent emojis to 27 (3 rows of 9)
const RECENT_EMOJIS_LIMIT = 27;

export type EmojiPickerProviderProps = { children: ReactNode };

const EmojiPickerProvider = ({ children }: EmojiPickerProviderProps) => {
	const [emojiPicker, setEmojiPicker] = useState<ReactNode>(null);
	const [emojiToPreview, setEmojiToPreview] = useDebouncedState<{ emoji: string; name: string } | null>(null, 100);
	const [recentEmojis, setRecentEmojis] = useLocalStorage<string[]>('emoji.recent', []);
	const [frequentEmojis, setFrequentEmojis] = useLocalStorage<[string, number][]>('emoji.frequent', []);

	const [actualTone, setActualTone] = useLocalStorage('emoji.tone', 0);
	const [currentCategory, setCurrentCategory] = useState('recent');

	const [customItemsLimit, setCustomItemsLimit] = useState(DEFAULT_ITEMS_LIMIT);

	const [quickReactions, _setQuickReactions] = useState<{ emoji: string; image: string }[]>(() =>
		getFrequentEmoji(frequentEmojis.map(([emoji]) => emoji)),
	);

	const setQuickReactions = useStableCallback(() => _setQuickReactions(getFrequentEmoji(frequentEmojis.map(([emoji]) => emoji))));
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
					return emojiName === emoji
						? ([emojiName, Math.min(count + 5, 100)] as [string, number])
						: ([emojiName, Math.max(count - 1, 0)] as [string, number]);
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
			const pos = recent.indexOf(_emoji);

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

	const customEmojiRoute = useRoute('emoji-custom');
	const goToAddCustomEmoji = useStableCallback(() => customEmojiRoute.push());

	const onCloseRef = useRef<() => void>(undefined);

	const close = useCallback(() => {
		setEmojiPicker(null);

		const onClose = onCloseRef.current;
		onCloseRef.current = undefined;
		onClose?.();
	}, []);

	const open = useCallback(
		(ref: Element, callback: (emoji: string) => void, onClose?: () => void) => {
			// A picker opened in place of another closes that one for whoever opened it.
			const previousOnClose = onCloseRef.current;
			onCloseRef.current = onClose;
			previousOnClose?.();

			setEmojiPicker(
				<EmojiPicker reference={ref} onClose={close} onPickEmoji={(emoji) => callback(emoji)} onAddCustomEmoji={goToAddCustomEmoji} />,
			);
		},
		[close, goToAddCustomEmoji],
	);

	const handlePreview = useCallback(
		(emoji: string, name: string) =>
			setEmojiToPreview((preview) => {
				if (preview?.emoji === emoji && preview?.name === name) {
					return preview;
				}
				return { emoji, name };
			}),
		[setEmojiToPreview],
	);

	const handleRemovePreview = useCallback(() => setEmojiToPreview(null), [setEmojiToPreview]);

	const contextValue = useMemo(
		(): ContextType<typeof EmojiPickerContext> => ({
			isOpen: emojiPicker !== null,
			close,
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
			close,
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
		<EmojiRegistryContext.Provider value={emoji}>
			<EmojiPickerContext.Provider value={contextValue}>
				{children}
				<Suspense fallback={null}>{emojiPicker}</Suspense>
			</EmojiPickerContext.Provider>
		</EmojiRegistryContext.Provider>
	);
};

export default EmojiPickerProvider;
