import { useCallback, useRef } from 'react';

export const useScrollMessageList = (callback: (element: HTMLElement) => ScrollToOptions | void) => {
	const ref = useRef<HTMLElement>(null);
	// Passing a callback instead of the values so that the wrapper is exposed
	const scrollTo = useCallback(() => {
		const wrapper = ref.current;

		if (!wrapper) {
			return;
		}

		const options = callback(wrapper);

		// allow for bailout
		if (!options) {
			return;
		}

		wrapper.scrollTo(options);
	}, [callback]);

	return {
		ref,
		scrollTo,
	};
};
