import type { Dispatch, SetStateAction } from 'react';
import { useState } from 'react';

import { useDebouncedUpdates } from './useDebouncedUpdates';

/**
 * Hook to create a state with a debounced setter function.
 *
 * @param initialValue - the initial state value or the initial state generator function
 * @param delay - the number of milliseconds to delay the updater
 * @returns a state and debounced setter function
 * @public
 */

export function useDebouncedState<S>(
	initialValue: S | (() => S),
	delay: number,
): [
	S,
	Dispatch<SetStateAction<S>> & {
		flush: () => void;
		cancel: () => void;
	},
] {
	return useDebouncedUpdates(useState(initialValue), delay);
}
