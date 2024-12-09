import { createFocusManager } from '@react-aria/focus';
import type { RefCallback } from 'react';
import { useCallback } from 'react';
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
export const useMessageListNavigation = (): { messageListRef: RefCallback<HTMLElement> } => {
	const roomFocusManager = useFocusManager();

	const messageListRef = useCallback(
		(node: HTMLElement | null) => {
			let lastMessageFocused: HTMLElement | null = null;
			let initialFocus = true;

			if (!node) {
				return;
			}

			const massageListFocusManager = createFocusManager({
				current: node,
			});

			node.addEventListener('keydown', (e) => {
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
			});

			node.addEventListener(
				'blur',
				(e) => {
					if (
						!(e.relatedTarget as HTMLElement)?.classList.contains('focus-visible') ||
						!(e.currentTarget instanceof HTMLElement && e.relatedTarget instanceof HTMLElement)
					) {
						return;
					}

					if (!e.currentTarget.contains(e.relatedTarget) && !lastMessageFocused) {
						lastMessageFocused = e.target as HTMLElement;
					}
				},
				{ capture: true },
			);

			node.addEventListener(
				'focus',
				(e) => {
					const triggeredByKeyboard = (e.target as HTMLElement)?.classList.contains('focus-visible');
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
				},
				{ capture: true },
			);
		},
		[roomFocusManager],
	);

	return {
		messageListRef,
	};
};
