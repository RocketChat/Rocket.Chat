const IMPORTANT_SUFFIX = /\s*!\s*important\s*$/i;

export type ValueList = {
	/** The top-level, whitespace-separated components of the value. */
	components: string[];
	/** `'!important'` when the declaration carried the flag, `''` otherwise. */
	important: string;
};

/**
 * Splits a shorthand value into its top-level components.
 *
 * Whitespace nested in functions (`calc()`, `var()`, `min()`, …) does not
 * separate components, and an `!important` flag is held aside so it can be
 * reattached to every expansion instead of ending up on the last one.
 *
 * Only parenthesis depth is tracked: every property routed through here takes
 * lengths, colors, keywords or border values, never strings, so a top-level
 * quote cannot occur in a valid value.
 */
export const splitValueList = (value: string): ValueList => {
	const important = IMPORTANT_SUFFIX.test(value) ? '!important' : '';
	const components: string[] = [];

	let component = '';
	let depth = 0;

	for (const char of value.replace(IMPORTANT_SUFFIX, '')) {
		if (char === '(') {
			depth += 1;
		} else if (char === ')') {
			depth = Math.max(depth - 1, 0);
		} else if (depth === 0 && /\s/.test(char)) {
			if (component) {
				components.push(component);
				component = '';
			}

			continue;
		}

		component += char;
	}

	if (component) {
		components.push(component);
	}

	return { components, important };
};
