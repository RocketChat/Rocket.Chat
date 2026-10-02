import { useCallback } from 'react';

type HoverCardDismissalOptions = {
	onPointerEnter: () => void;
	onPointerLeave: () => void;
	onDismiss: () => void;
};

// The card's own menu (its kebab) is portaled outside the card, so leaving the card for it must not close it.
const hasOpenMenu = (card: Element) => !!card.querySelector('[aria-expanded="true"]');

/**
 * Keeps a hover card open while the pointer is on it or on a menu it opened, reports when the pointer leaves, and
 * dismisses it on Escape. Returns a callback ref for the card.
 */
export const useHoverCardDismissal = ({
	onPointerEnter,
	onPointerLeave,
	onDismiss,
}: HoverCardDismissalOptions): ((card: HTMLElement | null) => (() => void) | undefined) =>
	useCallback(
		(card: HTMLElement | null) => {
			if (!card) {
				return;
			}

			// Native listeners on purpose: React's synthetic enter/leave report a leave when the card's content is swapped
			// under a resting pointer (the skeleton giving way to the loaded card), which would close it.
			let isHovered = false;
			const handlePointerEnter = (e: PointerEvent) => {
				if (e.pointerType === 'touch') {
					return;
				}
				isHovered = true;
				onPointerEnter();
			};
			const handlePointerLeave = (e: PointerEvent) => {
				if (e.pointerType === 'touch') {
					return;
				}
				isHovered = false;
				if (!hasOpenMenu(card)) {
					onPointerLeave();
				}
			};

			// A hover card never holds focus, so react-aria's focus-scoped Escape never fires (WCAG 1.4.13). Captured and
			// stopped here so it doesn't also close an underlying contextual bar; an open menu owns Escape instead.
			const handleKeyDown = (e: KeyboardEvent) => {
				if (e.key !== 'Escape' || document.querySelector('[role="menu"]')) {
					return;
				}
				e.stopImmediatePropagation();
				onDismiss();
			};

			// Once the card's menu closes with the pointer elsewhere, the card follows. Only that transition counts: the
			// menu trigger rendering as collapsed when the card loads is not a close.
			let menuOpen = false;
			const observer = new MutationObserver(() => {
				const wasOpen = menuOpen;
				menuOpen = hasOpenMenu(card);
				if (wasOpen && !menuOpen && !isHovered) {
					onPointerLeave();
				}
			});

			card.addEventListener('pointerenter', handlePointerEnter);
			card.addEventListener('pointerleave', handlePointerLeave);
			document.addEventListener('keydown', handleKeyDown, { capture: true });
			observer.observe(card, { subtree: true, attributeFilter: ['aria-expanded'] });
			return () => {
				card.removeEventListener('pointerenter', handlePointerEnter);
				card.removeEventListener('pointerleave', handlePointerLeave);
				document.removeEventListener('keydown', handleKeyDown, { capture: true });
				observer.disconnect();
			};
		},
		[onPointerEnter, onPointerLeave, onDismiss],
	);
