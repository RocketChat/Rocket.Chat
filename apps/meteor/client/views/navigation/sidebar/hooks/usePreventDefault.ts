import type { RefObject } from 'react';
import { useEffect } from 'react';

export const usePreventDefault = (ref: RefObject<Element>): { ref: RefObject<Element> } => {
	// Flowrouter uses an addEventListener on the document to capture any clink link, since the react synthetic event use an addEventListener on the document too,
	// it is impossible/hard to determine which one will happen before and prevent/stop propagation, so feel free to remove this effect after remove flow router :)

	useEffect(() => {
		const { current } = ref;
		const stopPropagation: EventListener = (e) => {
			if ([(e.target as HTMLElement).nodeName, (e.target as HTMLElement).parentElement?.nodeName].includes('BUTTON')) {
				e.preventDefault();
			}
		};
		current?.addEventListener('click', stopPropagation);

		return (): void => current?.addEventListener('click', stopPropagation);
	}, [ref]);

	return { ref };
};
