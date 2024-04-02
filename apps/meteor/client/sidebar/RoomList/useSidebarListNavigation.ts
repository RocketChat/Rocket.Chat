import { useFocusManager } from '@react-aria/focus';
import { useCallback } from 'react';

const isListItem = (node: EventTarget) => (node as HTMLElement).classList.contains('rcx-sidebar-item');
const isListItemMenu = (node: EventTarget) => (node as HTMLElement).classList.contains('rcx-sidebar-item__menu');

/**
 * Custom hook to provide the sidebar navigation by keyboard.
 * @param ref - A ref to the message list DOM element.
 */
export const useSidebarListNavigation = () => {
	const sidebarListFocusManager = useFocusManager();

	const sidebarListRef = useCallback(
		(node: HTMLElement | null) => {
			let lastMessageFocused: HTMLElement | null = null;
			let triggeredByKeyboard = false;

			if (!node) {
				return;
			}

			node.addEventListener('keydown', (e) => {
				if (!e.target) {
					return;
				}

				if (!isListItem(e.target) && !isListItemMenu(e.target)) {
					return;
				}

				if (e.key === 'Tab') {
					e.preventDefault();
					e.stopPropagation();

					if (e.shiftKey) {
						sidebarListFocusManager.focusPrevious({
							accept: (node) => !isListItem(node) && !isListItemMenu(node),
						});
					} else if (isListItemMenu(e.target)) {
						sidebarListFocusManager.focusNext({
							accept: (node) => !isListItem(node) && !isListItemMenu(node),
						});
					} else {
						sidebarListFocusManager.focusNext({
							accept: (node) => !isListItem(node),
						});
					}
				}

				if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
					if (e.key === 'ArrowUp') {
						sidebarListFocusManager.focusPrevious({ accept: (node) => isListItem(node) });
					}

					if (e.key === 'ArrowDown') {
						sidebarListFocusManager.focusNext({ accept: (node) => isListItem(node) });
					}

					lastMessageFocused = document.activeElement as HTMLElement;
				}

				triggeredByKeyboard = true;
			});

			node.addEventListener(
				'blur',
				(e) => {
					if (!triggeredByKeyboard || !(e.currentTarget instanceof HTMLElement && e.relatedTarget instanceof HTMLElement)) {
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
					if (!triggeredByKeyboard || !(e.currentTarget instanceof HTMLElement && e.relatedTarget instanceof HTMLElement)) {
						return;
					}

					if (lastMessageFocused && !e.currentTarget.contains(e.relatedTarget) && node.contains(e.target as HTMLElement)) {
						lastMessageFocused?.focus();
						lastMessageFocused = null;
						triggeredByKeyboard = false;
					}
				},
				{ capture: true },
			);
		},
		[sidebarListFocusManager],
	);

	return { sidebarListRef };
};
