import type { SetStateAction } from 'react';
import { useState } from 'react';

import { useStableCallback } from './useStableCallback';

/**
 * Hook to create a toggleable boolean state.
 *
 * @param initialValue - the initial value or the initial state generator function
 * @returns a state boolean value and a state toggler function
 * @public
 */
export const useToggle = (initialValue?: boolean | (() => boolean)): [boolean, (forcedValue?: SetStateAction<boolean>) => void] => {
	const [value, setValue] = useState(() => {
		if (typeof initialValue === 'function') {
			return !!initialValue();
		}

		return !!initialValue;
	});

	const dispatch = useStableCallback((forcedValue?: SetStateAction<boolean>) => {
		// uses value from scope to avoid multiple toggles in one render cycle
		setValue(() => {
			if (typeof forcedValue === 'boolean') {
				return forcedValue;
			}

			if (typeof forcedValue === 'function') {
				return forcedValue(value);
			}

			return !value;
		});
	});

	return [value, dispatch];
};
