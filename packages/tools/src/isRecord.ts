export function isRecord(record: unknown): record is Record<string | number | symbol, unknown> {
	if (!record || typeof record !== 'object') {
		return false;
	}

	return Object.getPrototypeOf(record).constructor === Object;
}
