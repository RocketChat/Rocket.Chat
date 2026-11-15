import { useState } from 'react';

/**
 * Key that changes once every selected value has its option loaded, and stays put afterwards.
 * Fuselage's AutoComplete only reads the selection's labels when it mounts, so it has to remount when they first arrive;
 * remounting again on a later search would drop the focus and the open dropdown while the user types.
 */
export const useAutoCompleteKey = (value: string | string[] | undefined, options: { value: string }[] | undefined) => {
	const [wasLoaded, setWasLoaded] = useState(false);

	const selected = ([] as (string | undefined)[]).concat(value).filter(Boolean);
	const loaded = wasLoaded || selected.every((item) => options?.some((option) => option.value === item));

	// Set during render rather than in an effect, so React discards it along with a render that never commits.
	if (loaded && !wasLoaded) {
		setWasLoaded(true);
	}

	return loaded ? 'selection-loaded' : 'selection-loading';
};
