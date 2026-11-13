import { createContext, useContext, useMemo } from 'react';

import type { EmojiPickerItem, CategoriesIndexes } from '../lib/emoji';

type EmojiPickerContextValue = {
	open: (ref: Element, callback: (emoji: string) => void, onClose?: () => void) => void;
	isOpen: boolean;
	close: () => void;
	emojiToPreview: { emoji: string; name: string } | null;
	handlePreview: (emoji: string, name: string) => void;
	handleRemovePreview: () => void;
	/** Counts an emoji as picked: recent, and frequent, which chooses the quick reactions. */
	addRecentEmoji: (emoji: string) => void;
	/** Counts an emoji toward the frequent ones only, for a use that is not a pick from the picker. */
	addFrequentEmoji: (emoji: string) => void;
	emojiListByCategory: EmojiPickerItem[];
	recentEmojis: string[];
	setRecentEmojis: (emoji: string[]) => void;
	actualTone: number;
	currentCategory: string;
	setCurrentCategory: (category: string) => void;
	customItemsLimit: number;
	setCustomItemsLimit: (limit: number) => void;
	setActualTone: (tone: number) => void;
	quickReactions: { emoji: string; image: string }[];
	categoriesIndexes: CategoriesIndexes;
};

export const EmojiPickerContext = createContext<EmojiPickerContextValue | undefined>(undefined);
const useEmojiPickerContext = (): EmojiPickerContextValue => {
	const context = useContext(EmojiPickerContext);
	if (!context) {
		throw new Error('Must be running in EmojiPicker Context');
	}

	return context;
};

export const useEmojiPicker = () => {
	const { open, isOpen, close } = useEmojiPickerContext();
	// Stable identity: consumers (e.g. ChatAPI.emojiPicker) use this as a memo
	// dependency, so returning a fresh object each render invalidates them and
	// cascades re-renders across the whole message list.
	return useMemo(() => ({ open, isOpen, close }), [open, isOpen, close]);
};

export const usePreviewEmoji = () => ({
	emojiToPreview: useEmojiPickerContext().emojiToPreview,
	handlePreview: useEmojiPickerContext().handlePreview,
	handleRemovePreview: useEmojiPickerContext().handleRemovePreview,
});

export const useEmojiPickerData = () => {
	const {
		actualTone,
		addRecentEmoji,
		addFrequentEmoji,
		currentCategory,
		categoriesIndexes,
		customItemsLimit,
		emojiListByCategory,
		quickReactions,
		recentEmojis,
		setActualTone,
		setCurrentCategory,
		setCustomItemsLimit,
		setRecentEmojis,
	} = useEmojiPickerContext();

	return {
		addRecentEmoji,
		addFrequentEmoji,
		emojiListByCategory,
		recentEmojis,
		setRecentEmojis,
		actualTone,
		currentCategory,
		categoriesIndexes,
		setCurrentCategory,
		customItemsLimit,
		setCustomItemsLimit,
		setActualTone,
		quickReactions,
	};
};
