import type { RefObject, UIEvent } from 'react';
import { useCallback, useEffect } from 'react';

import { openEmojiPicker, closeEmojiPicker } from '../../../../../app/ui/client/lib/emojiPicker';

export const useEmojiPicker = () => {
	useEffect(() => {
		return () => {
			closeEmojiPicker();
		};
	}, []);

	const open = useCallback((ref: RefObject<HTMLElement>, callback: (emoji: string) => void) => {
		// event.preventDefault();
		openEmojiPicker({
			reference: ref,
			onClose: closeEmojiPicker,
			onPickEmoji: (emoji: string) => {
				callback(emoji);
				closeEmojiPicker();
			},
		});
	}, []);

	return { open, close: closeEmojiPicker };
};
