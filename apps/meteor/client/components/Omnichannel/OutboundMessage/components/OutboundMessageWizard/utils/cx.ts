/**
 * A utility function that creates a string from an object of conditional values
 *
 * @param conditionals An object where keys are strings and values are booleans
 * @returns A string of space-separated entries from keys with truthy values
 *
 * @example
 * cx({ 'btn': true, 'btn-primary': true, 'disabled': false })
 * // returns 'btn btn-primary'
 */
export const cx = (conditionals: Record<string, boolean | undefined | null>): string => {
	return Object.entries(conditionals)
		.filter(([_, value]) => Boolean(value))
		.map(([key]) => key)
		.join(' ');
};

/**
 * A utility function that creates a string with prefixed keys from an object of conditional values
 *
 * @param prefix String to prepend to each key
 * @param conditionals An object where keys are strings and values are booleans
 * @returns A string of space-separated entries from prefixed keys with truthy values
 *
 * @example
 * cxp('form-field', { 'error': true, 'hint': false })
 * // returns 'form-field-error'
 */
export const cxp = (prefix: string, conditionals: Record<string, boolean | undefined | null>): string => {
	return Object.entries(conditionals)
		.filter(([_, value]) => Boolean(value))
		.map(([key]) => `${prefix}-${key}`)
		.join(' ');
};
