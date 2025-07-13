export function parseTimestamp(timestamp: string | undefined): Date | undefined {
	if (!timestamp || timestamp === '0') {
		return undefined;
	}

	const value = parseInt(timestamp);
	if (Number.isNaN(value) || value < 0) {
		return undefined;
	}

	const timeValue = Math.floor(value / 1000);
	return new Date(timeValue);
}
