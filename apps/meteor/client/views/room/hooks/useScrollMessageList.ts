import type { ComponentProps, RefObject } from 'react';
import { useCallback } from 'react';

import type MessageListProvider from '../MessageList/providers/MessageListProvider';

export const useScrollMessageList = (
	wrapperRef: RefObject<HTMLDivElement>,
): Exclude<ComponentProps<typeof MessageListProvider>['scrollMessageList'], undefined> => {
	// Passing a callback instead of the values so that the wrapper is exposed
	return useCallback(
		(callback) => {
			const wrapper = wrapperRef.current;

			if (!wrapper) {
				return;
			}

			const options = callback(wrapperRef.current);

			// allow for bailout
			if (!options) {
				return;
			}

			wrapper.scrollTo(options);
		},
		[wrapperRef],
	);
};
