export function isPlainObject(value: unknown) {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}
