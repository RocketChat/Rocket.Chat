import { useHover } from '@react-aria/interactions';
import type { DOMAttributes } from 'react';
import { useCallback, useRef } from 'react';

type HoverCardDismissalOptions = {
	onPointerEnter: () => void;
	onPointerLeave: () => void;
	onDismiss: () => void;
};

// The card's own menu (its kebab) is portaled outside the card, so leaving the card for it must not close it.
const hasOpenMenu = (card: Element) => !!card.querySelector('[aria-expanded="true"]');

/**
 * Keeps a hover card open while the pointer is on it or on a menu it opened, reports when the pointer leaves, and
 * dismisses it on Escape. Returns a callback ref and the hover props to put on the card.
 */
export const useHoverCardDismissal = ({
	onPointerEnter,
	onPointerLeave,
	onDismiss,
}: HoverCardDismissalOptions): { ref: (card: HTMLElement | null) => (() => void) | undefined; hoverProps: DOMAttributes<HTMLElement> } => {
	const isHoveredRef = useRef(false);

	const { hoverProps } = useHover({
		onHoverStart: () => {
			isHoveredRef.current = true;
			onPointerEnter();
		},
		onHoverEnd: (e) => {
			isHoveredRef.current = false;
			if (!hasOpenMenu(e.target)) {
				onPointerLeave();
			}
		},
	});

	const ref = useCallback(
		(card: HTMLElement | null) => {
			if (!card) {
				return;
			}

			// A hover card never holds focus, so react-aria's focus-scoped Escape never fires (WCAG 1.4.13). Captured and
			// stopped here so it doesn't also close an underlying contextual bar; an open menu owns Escape instead.
			const handleKeyDown = (e: KeyboardEvent) => {
				if (e.key !== 'Escape' || document.querySelector('[role="menu"]')) {
					return;
				}
				e.stopImmediatePropagation();
				onDismiss();
			};

			// Once the card's menu closes with the pointer elsewhere, the card follows.
			const observer = new MutationObserver(() => {
				if (!isHoveredRef.current && !hasOpenMenu(card)) {
					onPointerLeave();
				}
			});

			document.addEventListener('keydown', handleKeyDown, { capture: true });
			observer.observe(card, { subtree: true, attributeFilter: ['aria-expanded'] });
			return () => {
				document.removeEventListener('keydown', handleKeyDown, { capture: true });
				observer.disconnect();
			};
		},
		[onPointerLeave, onDismiss],
	);

	return { ref, hoverProps };
};
