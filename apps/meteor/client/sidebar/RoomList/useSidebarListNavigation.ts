import { useFocusManager } from '@react-aria/focus';
import { useCallback, useRef } from 'react';

const isListItem = (node: EventTarget) => (node as HTMLElement).classList.contains('rcx-sidebar-item');
const isCollapseGroup = (node: EventTarget) => (node as HTMLElement).classList.contains('rcx-sidebar-collapse-group__bar-button');
const isListItemMenu = (node: EventTarget) => (node as HTMLElement).classList.contains('rcx-sidebar-item__menu');

/**
 * Custom hook to provide the sidebar navigation by keyboard.
 * @returns ref - A ref to the message list DOM element.
 */
export const useSidebarListNavigation = () => {
	const sidebarListFocusManager = useFocusManager();

	const detachListenersRef = useRef<(() => void) | undefined>(undefined);

	const sidebarListRef = useCallback(
		(node: HTMLElement | null) => {
			detachListenersRef.current?.();
			detachListenersRef.current = undefined;

			let lastItemFocused: HTMLElement | null = null;

			if (!node) {
				return;
			}

			const handleKeyDown = (e: KeyboardEvent) => {
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
					} else if (isCollapseGroup(e.target)) {
						
						sidebarListFocusManager?.focusNext({ accept: (node) => isListItem(node) || isCollapseGroup(node) });
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
			};

			const handleBlur = (e: FocusEvent) => {
				if (
					!(e.relatedTarget as HTMLElement)?.matches(':focus-visible') ||
					!(e.currentTarget instanceof HTMLElement && e.relatedTarget instanceof HTMLElement)
				) {
					return;
				}

				if (!e.currentTarget.contains(e.relatedTarget) && !lastItemFocused) {
					lastItemFocused = e.target as HTMLElement;
				}
			};

			const handleFocus = (e: FocusEvent) => {
				const triggeredByKeyboard = (e.target as HTMLElement)?.matches(':focus-visible');
				if (!triggeredByKeyboard || !(e.currentTarget instanceof HTMLElement && e.relatedTarget instanceof HTMLElement)) {
					return;
				}

				if (lastItemFocused && !e.currentTarget.contains(e.relatedTarget) && node.contains(e.target as HTMLElement)) {
					lastItemFocused?.focus();
				}
			};

			node.addEventListener('keydown', handleKeyDown);
			node.addEventListener('blur', handleBlur, { capture: true });
			node.addEventListener('focus', handleFocus, { capture: true });

			detachListenersRef.current = () => {
				node.removeEventListener('keydown', handleKeyDown);
				node.removeEventListener('blur', handleBlur, { capture: true });
				node.removeEventListener('focus', handleFocus, { capture: true });
			};
		},
		[sidebarListFocusManager],
	);

	return { sidebarListRef };
};
