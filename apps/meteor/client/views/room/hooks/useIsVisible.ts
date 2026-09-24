import { useDebouncedState, useSafely } from '@rocket.chat/fuselage-hooks';
import type { RefCallback } from 'react';
import { useCallback } from 'react';

// One observer serves every message row; creating one per row costs an observer per rendered message.
const listeners = new Map<Element, (isIntersecting: boolean) => void>();
let observer: IntersectionObserver | undefined;

const observe = (node: Element, listener: (isIntersecting: boolean) => void) => {
	observer ??= new IntersectionObserver((entries) => {
		entries.forEach((entry) => {
			listeners.get(entry.target)?.(entry.isIntersecting);
		});
	});

	listeners.set(node, listener);
	observer.observe(node);

	return () => {
		listeners.delete(node);
		observer?.unobserve(node);
	};
};

export const useIsVisible = () => {
	const [menuVisibility, setMenuVisibility] = useSafely(useDebouncedState(!!window.DISABLE_ANIMATION, 100));

	const callbackRef: RefCallback<HTMLElement> = useCallback((node: HTMLElement) => observe(node, setMenuVisibility), [setMenuVisibility]);

	return [callbackRef, menuVisibility] as const;
};
