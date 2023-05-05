import { createContext, useContext } from 'react';

type EmojiPickerContextValue = {
	open: (ref: Element, callback: (emoji: string) => void) => void;
	isOpen: boolean;
	close: () => void;
};

export const EmojiPickerContext = createContext<EmojiPickerContextValue | undefined>(undefined);
const useEmojiPickerContext = (): EmojiPickerContextValue => {
	const context = useContext(EmojiPickerContext);
	if (!context) {
		throw new Error('Must be running in EmojiPicker Context');
	}

	return context;
};

export const useEmojiPicker = () => useEmojiPickerContext();
