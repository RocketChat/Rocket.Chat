import { useCallback, useEffect } from 'react';

import { openEmojiPicker, closeEmojiPicker } from '../../app/ui/client/lib/emojiPicker';

export const useEmojiPicker = () => {
	useEffect(() => {
		return () => {
			closeEmojiPicker();
		};
	}, []);

	const open = useCallback((ref: Element, callback: (emoji: string) => void) => {
		openEmojiPicker({
			reference: ref,
			onClose: closeEmojiPicker,
			onPickEmoji: (emoji: string) => {
				callback(emoji);
			},
		});
	}, []);

	return { open, close: closeEmojiPicker };
};
