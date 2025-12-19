export function isPlainObject(value: unknown): value is Record<string | symbol, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}
