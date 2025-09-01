import { useCallback } from 'react';
import { useFocusManager } from 'react-aria';

const isListItem = (node: EventTarget) => (node as HTMLElement).classList.contains('rcx-sidebar-v2-item');
const isCollapseGroup = (node: EventTarget) => (node as HTMLElement).classList.contains('rcx-sidebar-v2-collapse-group__bar');
const isListItemMenu = (node: EventTarget) => (node as HTMLElement).classList.contains('rcx-sidebar-v2-item__menu');

/**
 * Custom hook to provide the sidebar navigation by keyboard.
 * @returns ref - A ref to the message list DOM element.
 */
export const useSidebarListNavigation = () => {
	const sidebarListFocusManager = useFocusManager();

	const sidebarListRef = useCallback(
		(node: HTMLElement | null) => {
			let lastItemFocused: HTMLElement | null = null;

			if (!node) {
				return;
			}

			node.addEventListener('keydown', (e) => {
				if (!e.target) {
					return;
				}

				if (!isListItem(e.target) && !isCollapseGroup(e.target)) {
					return;
				}

				if (e.key === 'Tab') {
					e.preventDefault();
					e.stopPropagation();

					if (e.shiftKey) {
						sidebarListFocusManager?.focusPrevious({
							accept: (node) => !isListItem(node) && !isListItemMenu(node) && !isCollapseGroup(node),
						});
					} else if (isListItemMenu(e.target)) {
						sidebarListFocusManager?.focusNext({
							accept: (node) => !isListItem(node) && !isListItemMenu(node) && !isCollapseGroup(node),
						});
					} else {
						sidebarListFocusManager?.focusNext({
							accept: (node) => !isListItem(node) && !isCollapseGroup(node),
						});
					}
				}

				if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
					e.preventDefault();
					e.stopPropagation();

					if (e.key === 'ArrowUp') {
						sidebarListFocusManager?.focusPrevious({ accept: (node) => isListItem(node) || isCollapseGroup(node) });
					}

					if (e.key === 'ArrowDown') {
						sidebarListFocusManager?.focusNext({ accept: (node) => isListItem(node) || isCollapseGroup(node) });
					}

					lastItemFocused = document.activeElement as HTMLElement;
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

					if (!e.currentTarget.contains(e.relatedTarget) && !lastItemFocused) {
						lastItemFocused = e.target as HTMLElement;
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

					if (lastItemFocused && !e.currentTarget.contains(e.relatedTarget) && node.contains(e.target as HTMLElement)) {
						lastItemFocused?.focus();
					}
				},
				{ capture: true },
			);
		},
		[sidebarListFocusManager],
	);

	return { sidebarListRef };
};
