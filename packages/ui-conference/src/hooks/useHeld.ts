import type { RefCallback } from 'react';
import { useCallback, useState } from 'react';

/** Whether someone is busy with an element: the pointer is over it, or focus is inside it. */
export const useHeld = (): [ref: RefCallback<HTMLElement>, held: boolean] => {
	const [hovered, setHovered] = useState(false);
	const [focused, setFocused] = useState(false);

	const ref = useCallback((node: HTMLElement) => {
		const handlePointerEnter = () => setHovered(true);
		const handlePointerLeave = () => setHovered(false);
		const handleFocusIn = () => setFocused(true);
		const handleFocusOut = (event: FocusEvent) => {
			if (!node.contains(event.relatedTarget as Node | null)) {
				setFocused(false);
			}
		};

		// Removing the focused element takes focus with it and fires no event to say so.
		const removals = new MutationObserver(() => {
			if (!node.contains(node.ownerDocument.activeElement)) {
				setFocused(false);
			}
		});
		removals.observe(node, { childList: true, subtree: true });

		node.addEventListener('pointerenter', handlePointerEnter);
		node.addEventListener('pointerleave', handlePointerLeave);
		node.addEventListener('focusin', handleFocusIn);
		node.addEventListener('focusout', handleFocusOut);

		return () => {
			removals.disconnect();
			node.removeEventListener('pointerenter', handlePointerEnter);
			node.removeEventListener('pointerleave', handlePointerLeave);
			node.removeEventListener('focusin', handleFocusIn);
			node.removeEventListener('focusout', handleFocusOut);
			setHovered(false);
			setFocused(false);
		};
	}, []);

	return [ref, hovered || focused];
};
