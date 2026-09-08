/**
 * Mitel identifies the call duration with a string in the HH:mm:ss format
 */
export function parseMitelDuration(value: unknown): number {
	if (!value) {
		return 0;
	}

	if (typeof value === 'number' && !Number.isNaN(value) && value >= 0 && Number.isFinite(value)) {
		return value;
	}

	if (typeof value !== 'string') {
		return 0;
	}

	const values = value.split(':').map((value) => parseInt(value, 10) || 0);

	const seconds = values.pop() || 0;
	const minutes = values.pop() || 0;
	const hours = values.pop() || 0;

	return (hours * 60 + minutes) * 60 + seconds || 0;
}
