import type { ReactNode, ReactElement } from 'react';
import React, { useState, useCallback } from 'react';

import { EmojiPickerContext } from '../contexts/EmojiPickerContext';
import EmojiPicker from '../views/composer/EmojiPicker/EmojiPicker';

const EmojiProvider = ({ children }: { children: ReactNode }): ReactElement => {
	const [emojiPicker, setEmojiPicker] = useState<ReactElement | null>(null);

	const open = useCallback((ref: Element, callback: (emoji: string) => void) => {
		return setEmojiPicker(<EmojiPicker reference={ref} onClose={() => setEmojiPicker(null)} onPickEmoji={(emoji) => callback(emoji)} />);
	}, []);

	const contextValue = {
		isOpen: emojiPicker !== null,
		close: () => setEmojiPicker(null),
		open,
	};

	return (
		<EmojiPickerContext.Provider value={contextValue}>
			{children}
			{emojiPicker}
		</EmojiPickerContext.Provider>
	);
};

export default EmojiProvider;
