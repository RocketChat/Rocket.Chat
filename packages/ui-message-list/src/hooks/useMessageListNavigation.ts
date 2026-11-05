import { useFocusManager } from '@react-aria/focus';
import type { RefCallback } from 'react';
import { useCallback } from 'react';

import { useItemListNavigation } from './useItemListNavigation';
import { isMessageRow, messageRowSelector } from './useMessageRowListNavigation';

const isComposerField = (node: Element) => node.tagName === 'TEXTAREA' || (node as HTMLElement).isContentEditable;

export type MessageListNavigationOptions = {
	scrollToAdjacentRow?: (item: HTMLElement, direction: 'up' | 'down') => void;
	onMoveBetweenRows?: () => void;
};

/**
 * Gives a room or thread message list the keyboard model of the other lists, opening on the latest message: Tab walks the
 * focused message, then moves to the composer instead of the next message, and Shift+Tab before it moves to the top of the
 * room, or of the contextual bar for a thread.
 */
export const useMessageListNavigation = ({
	scrollToAdjacentRow,
	onMoveBetweenRows,
}: MessageListNavigationOptions = {}): RefCallback<HTMLElement> => {
	const roomFocusManager = useFocusManager();

	const onLeave = useCallback(
		(direction: 'next' | 'previous', list: HTMLElement) => {
			if (!roomFocusManager) {
				return false;
			}

			const moved =
				direction === 'next' ? roomFocusManager.focusNext({ from: list, accept: isComposerField }) : roomFocusManager.focusFirst();
			return !!moved;
		},
		[roomFocusManager],
	);

	return useItemListNavigation({
		isItem: isMessageRow,
		rowSelector: messageRowSelector,
		enterAtLast: true,
		onLeave,
		scrollToAdjacentRow,
		onMoveBetweenRows,
	});
};
