import type { RefObject } from 'react';
import { useEffect } from 'react';

export const usePreventDefault = (
	ref: RefObject<Element>,
): { ref: RefObject<Element> } => {
	// Flowrouter uses an addEventListener on the document to capture any click link.
	// Since React synthetic events also use document-level listeners,
	// this prevents propagation conflicts.
	// This effect can be removed once Flowrouter is removed.

	useEffect(() => {
		const { current } = ref;

		const stopPropagation: EventListener = (e) => {
			const target = e.target as HTMLElement;

			if (
				[target.nodeName, target.parentElement?.nodeName].includes(
					'BUTTON',
				)
			) {
				e.preventDefault();
			}
		};

		current?.addEventListener('click', stopPropagation);

		return (): void => {
			current?.removeEventListener('click', stopPropagation);
		};
	}, [ref]);

	return { ref };
};
