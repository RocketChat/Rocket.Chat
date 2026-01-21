export const getHeader = (headers: unknown, key: string): string => {
	if (!headers) {
		return '';
	}

	if (typeof (headers as any).get === 'function') {
		return (headers as Headers).get(key) ?? '';
	}

	return (headers as Record<string, string | undefined>)[key] || '';
};
