/**
 * Key that changes once every selected value has its option loaded.
 * Fuselage's AutoComplete only reads the selection's labels when it mounts, so it has to remount when they arrive.
 */
export const getAutoCompleteKey = (value: string | string[] | undefined, options: { value: string }[] | undefined) => {
	const selected = ([] as (string | undefined)[]).concat(value).filter(Boolean);
	return selected.every((item) => options?.some((option) => option.value === item)) ? 'selection-loaded' : 'selection-loading';
};
