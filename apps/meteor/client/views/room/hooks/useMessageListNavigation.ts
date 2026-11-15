import { createFocusManager, useFocusManager } from '@react-aria/focus';
import type { RefCallback } from 'react';
import { useCallback } from 'react';

const isListItem = (node: EventTarget) =>
	(node as HTMLElement).getAttribute('role') === 'listitem' || (node as HTMLElement).getAttribute('role') === 'link';
const isMessageToolbarAction = (node: EventTarget) => (node as HTMLElement).parentElement?.getAttribute('role') === 'toolbar';
const isSystemMessage = (node: EventTarget) => (node as HTMLElement).classList.contains('rcx-message-system');
const isThreadMessage = (node: EventTarget) => (node as HTMLElement).classList.contains('rcx-message-thread');

/**
 * Custom hook to provide the room navigation by keyboard.
 * @param ref - A ref to the message list DOM element.
 */
export const useMessageListNavigation = (): { messageListRef: RefCallback<HTMLElement> } => {
	const roomFocusManager = useFocusManager();

	const messageListRef = useCallback(
		(node: HTMLElement) => {
			let lastMessageFocused: HTMLElement | null = null;
			let initialFocus = true;

			const massageListFocusManager = createFocusManager({
				current: node,
			});

			const onKeyDown = (e: KeyboardEvent) => {
				if (!e.target) {
					return;
				}

				if (!isListItem(e.target)) {
					return;
				}

				if (e.key === 'Tab') {
					if (e.shiftKey) {
						e.preventDefault();
						e.stopPropagation();

						roomFocusManager?.focusFirst({
							from: document.getElementsByClassName('rcx-room-header')[0],
						});
					} else if (isThreadMessage(e.target) || isSystemMessage(e.target) || isMessageToolbarAction(e.target)) {
						e.preventDefault();
						e.stopPropagation();

						roomFocusManager?.focusNext({
							accept: (node) => node.tagName === 'TEXTAREA',
						});
					}
				}

				if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
					if (e.key === 'ArrowUp') {
						massageListFocusManager.focusPrevious({ accept: (node) => isListItem(node) });
					}

					if (e.key === 'ArrowDown') {
						massageListFocusManager.focusNext({ accept: (node) => isListItem(node) });
					}

					lastMessageFocused = document.activeElement as HTMLElement;
				}
			};

			const onBlur = (e: FocusEvent) => {
				if (
					!(e.relatedTarget as HTMLElement)?.matches(':focus-visible') ||
					!(e.currentTarget instanceof HTMLElement && e.relatedTarget instanceof HTMLElement)
				) {
					return;
				}

				if (!e.currentTarget.contains(e.relatedTarget) && !lastMessageFocused) {
					lastMessageFocused = e.target as HTMLElement;
				}
			};

			const onFocus = (e: FocusEvent) => {
				const triggeredByKeyboard = (e.target as HTMLElement)?.matches(':focus-visible');
				if (!triggeredByKeyboard || !(e.currentTarget instanceof HTMLElement && e.relatedTarget instanceof HTMLElement)) {
					return;
				}

				if (initialFocus) {
					massageListFocusManager.focusLast({ accept: (node) => isListItem(node) });
					lastMessageFocused = document.activeElement as HTMLElement;
					initialFocus = false;
					return;
				}

				if (lastMessageFocused && !e.currentTarget.contains(e.relatedTarget) && node.contains(e.target as HTMLElement)) {
					lastMessageFocused?.focus();
				}
			};

			node.addEventListener('keydown', onKeyDown);
			node.addEventListener('blur', onBlur, { capture: true });
			node.addEventListener('focus', onFocus, { capture: true });

			return () => {
				node.removeEventListener('keydown', onKeyDown);
				node.removeEventListener('blur', onBlur, { capture: true });
				node.removeEventListener('focus', onFocus, { capture: true });
			};
		},
		[roomFocusManager],
	);

	return {
		messageListRef,
	};
};
