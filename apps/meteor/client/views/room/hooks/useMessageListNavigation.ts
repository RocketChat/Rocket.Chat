import { createFocusManager } from '@react-aria/focus';
import type { RefObject, FocusEvent } from 'react';
import { type KeyboardEvent, useRef } from 'react';
import { useFocusManager } from 'react-aria';

const isListItem = (node: EventTarget) =>
	(node as HTMLElement).getAttribute('role') === 'listitem' || (node as HTMLElement).getAttribute('role') === 'link';
const isMessageToolbarAction = (node: EventTarget) => (node as HTMLElement).parentElement?.getAttribute('role') === 'toolbar';
const isSystemMessage = (node: EventTarget) => (node as HTMLElement).classList.contains('rcx-message-system');
const isThreadMessage = (node: EventTarget) => (node as HTMLElement).classList.contains('rcx-message-thread');

/**
 * Custom hook to provide the room navigation by keyboard.
 * @param ref - A ref to the message list DOM element.
 */
export const useMessageListNavigation = (ref: RefObject<HTMLDivElement>) => {
	const lastMessageFocused = useRef<HTMLElement | null>(null);
	const massageListFocusManager = createFocusManager(ref);
	const roomFocusManager = useFocusManager();

	const handleKeyDown = (e: KeyboardEvent) => {
		if (!isListItem(e.target)) {
			return;
		}

		if (e.key === 'Tab') {
			if (e.shiftKey) {
				e.preventDefault();
				e.stopPropagation();

				roomFocusManager.focusFirst({
					from: document.getElementsByClassName('rcx-room-header')[0],
				});
			} else if (isThreadMessage(e.target) || isSystemMessage(e.target) || isMessageToolbarAction(e.target)) {
				e.preventDefault();
				e.stopPropagation();

				roomFocusManager.focusNext({
					accept: (node) => node.tagName === 'TEXTAREA',
				});
			}
		}

		if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
			if (e.key === 'ArrowUp') {
				massageListFocusManager.focusPrevious({ wrap: true, accept: (node) => isListItem(node) });
			}

			if (e.key === 'ArrowDown') {
				massageListFocusManager.focusNext({ wrap: true, accept: (node) => isListItem(node) });
			}

			lastMessageFocused.current = document.activeElement as HTMLElement;
		}
	};

	const handleOnBlur = (e: FocusEvent<HTMLElement>) => {
		if (!e.currentTarget.contains(e.relatedTarget) && !lastMessageFocused.current) {
			lastMessageFocused.current = e.target;
		}
	};

	const handleFocus = (e: FocusEvent<HTMLElement>) => {
		if (lastMessageFocused.current && !e.currentTarget.contains(e.relatedTarget) && ref.current?.contains(e.target)) {
			lastMessageFocused.current?.focus();
			lastMessageFocused.current = null;
		}
	};

	return {
		messageListProps: {
			onBlurCapture: handleOnBlur,
			onFocusCapture: handleFocus,
			onKeyDownCapture: handleKeyDown,
		},
	};
};
