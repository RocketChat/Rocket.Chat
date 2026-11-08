import type { RefCallback } from 'react';
import { useCallback } from 'react';

// Flowrouter uses an addEventListener on the document to capture any clink link, since the react synthetic event use an addEventListener on the document too,
// it is impossible/hard to determine which one will happen before and prevent/stop propagation, so feel free to remove this hook after remove flow router :)
export const usePreventDefault = (): RefCallback<HTMLElement> =>
	useCallback((node: HTMLElement) => {
		const stopPropagation: EventListener = (e) => {
			if ([(e.target as HTMLElement).nodeName, (e.target as HTMLElement).parentElement?.nodeName].includes('BUTTON')) {
				e.preventDefault();
			}
		};

		node.addEventListener('click', stopPropagation);

		return () => node.removeEventListener('click', stopPropagation);
	}, []);
