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
	getEmojiListsByCategory: () => EmojiByCategory[];
	recentEmojis: string[];
	setRecentEmojis: (emoji: string[]) => void;
	actualTone: number;
	currentCategory: string;
	setCurrentCategory: (category: string) => void;
	customItemsLimit: number;
	setCustomItemsLimit: (limit: number) => void;
	setActualTone: (tone: number) => void;
	quickReactions: { emoji: string; image: string }[];
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

export const useEmojiPickerData = () => {
	const {
		actualTone,
		addRecentEmoji,
		currentCategory,
		customItemsLimit,
		getEmojiListsByCategory,
		quickReactions,
		recentEmojis,
		setActualTone,
		setCurrentCategory,
		setCustomItemsLimit,
		setRecentEmojis,
	} = useEmojiPickerContext();

	return {
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
	};
};
