const separator = ',';

export function triggerWordsToArray(s?: string): Array<string> {
	if (typeof s !== 'string' || s.length === 0) {
		return [];
	}

	return s.split(separator);
}

export function triggerWordsToString(triggerWords?: Array<string>): string {
	return triggerWords?.join(separator) ?? '';
}
