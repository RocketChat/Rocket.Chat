import { useRef } from 'react';

/**
 * Key that changes once every selected value has its option loaded, and stays put afterwards.
 * Fuselage's AutoComplete only reads the selection's labels when it mounts, so it has to remount when they first arrive;
 * remounting again on a later search would drop the focus and the open dropdown while the user types.
 */
export const useAutoCompleteKey = (value: string | string[] | undefined, options: { value: string }[] | undefined) => {
	const loaded = useRef(false);

	if (!loaded.current) {
		const selected = ([] as (string | undefined)[]).concat(value).filter(Boolean);
		loaded.current = selected.every((item) => options?.some((option) => option.value === item));
	}

	return loaded.current ? 'selection-loaded' : 'selection-loading';
};
