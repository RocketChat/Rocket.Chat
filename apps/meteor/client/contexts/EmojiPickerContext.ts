import { createContext, useContext } from 'react';

import type { EmojiByCategory } from '../../app/emoji/client';

type EmojiPickerContextValue = {
	open: (ref: Element, callback: (emoji: string) => void) => void;
	isOpen: boolean;
	close: () => void;
	emojiToPreview: { emoji: string; name: string } | null;
	handlePreview: (emoji: string, name: string) => void;
	handleRemovePreview: () => void;
	addRecentEmoji: (emoji: string) => void;
	emojiListByCategory: EmojiByCategory[];
	recentEmojis: string[];
	setRecentEmojis: (emoji: string[]) => void;
	actualTone: number;
	currentCategory: string;
	setCurrentCategory: (category: string) => void;
	customItemsLimit: number;
	setCustomItemsLimit: (limit: number) => void;
	setActualTone: (tone: number) => void;
};

export const EmojiPickerContext = createContext<EmojiPickerContextValue | undefined>(undefined);
const useEmojiPickerContext = (): EmojiPickerContextValue => {
	const context = useContext(EmojiPickerContext);
	if (!context) {
		throw new Error('Must be running in EmojiPicker Context');
	}

	return context;
};

export const useEmojiPicker = () => ({
	open: useEmojiPickerContext().open,
	isOpen: useEmojiPickerContext().isOpen,
	close: useEmojiPickerContext().close,
});

export const usePreviewEmoji = () => ({
	emojiToPreview: useEmojiPickerContext().emojiToPreview,
	handlePreview: useEmojiPickerContext().handlePreview,
	handleRemovePreview: useEmojiPickerContext().handleRemovePreview,
});

export const useEmojiPickerData = () => ({
	addRecentEmoji: useEmojiPickerContext().addRecentEmoji,
	emojiListByCategory: useEmojiPickerContext().emojiListByCategory,
	recentEmojis: useEmojiPickerContext().recentEmojis,
	setRecentEmojis: useEmojiPickerContext().setRecentEmojis,
	actualTone: useEmojiPickerContext().actualTone,
	currentCategory: useEmojiPickerContext().currentCategory,
	setCurrentCategory: useEmojiPickerContext().setCurrentCategory,
	customItemsLimit: useEmojiPickerContext().customItemsLimit,
	setCustomItemsLimit: useEmojiPickerContext().setCustomItemsLimit,
	setActualTone: useEmojiPickerContext().setActualTone,
});
