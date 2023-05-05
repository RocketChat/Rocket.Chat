import { useDebouncedState } from '@rocket.chat/fuselage-hooks';
import type { ReactNode, ReactElement } from 'react';
import React, { useState, useCallback, useMemo } from 'react';

import { EmojiPickerContext } from '../contexts/EmojiPickerContext';
import EmojiPicker from '../views/composer/EmojiPicker/EmojiPicker';

const EmojiPickerProvider = ({ children }: { children: ReactNode }): ReactElement => {
	const [emojiPicker, setEmojiPicker] = useState<ReactElement | null>(null);
	const [emojiToPreview, setEmojiToPreview] = useDebouncedState<{ emoji: string; name: string } | null>(null, 100);

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
		}),
		[emojiPicker, open, emojiToPreview, setEmojiToPreview],
	);

	return (
		<EmojiPickerContext.Provider value={contextValue}>
			{children}
			{emojiPicker}
		</EmojiPickerContext.Provider>
	);
};

export default EmojiPickerProvider;
