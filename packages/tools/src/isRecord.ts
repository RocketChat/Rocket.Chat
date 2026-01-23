export function isRecord(record: unknown): record is Record<string | number | symbol, unknown> {
	if (!record || typeof record !== 'object') {
		return false;
	}

	const prototype = Object.getPrototypeOf(record);

	if (prototype === null) {
		return true;
	}

	return prototype.constructor === Object;
}
