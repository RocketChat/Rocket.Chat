import { useEffect } from 'react';

export const usePreventDefault = (ref) => {
	// Flowrouter uses an addEventListener on the document to capture any clink link, since the react synthetic event use an addEventListener on the document too,
	// it is impossible/hard to determine which one will happen before and prevent/stop propagation, so feel free to remove this effect after remove flow router :)

	useEffect(() => {
		const { current } = ref;
		const stopPropagation = (e) => {
			if ([e.target.nodeName, e.target.parentElement.nodeName].includes('BUTTON')) {
				e.preventDefault();
			}
		};
		current?.addEventListener('click', stopPropagation);

		return () => current?.addEventListener('click', stopPropagation);
	}, [ref]);

	return { ref };
};
