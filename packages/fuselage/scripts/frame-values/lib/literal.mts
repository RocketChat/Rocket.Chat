export type Value = string | number | { [key: string]: Value };

/** A value as TypeScript source, keys quoted, `undefined` entries left out. */
export const literal = (value: Value, indent = ''): string => {
	if (typeof value !== 'object') {
		return JSON.stringify(value);
	}

	return `{\n${Object.entries(value)
		.filter(([, entry]) => entry !== undefined)
		.map(([key, entry]) => `${indent}\t${JSON.stringify(key)}: ${literal(entry, `${indent}\t`)},`)
		.join('\n')}\n${indent}}`;
};
