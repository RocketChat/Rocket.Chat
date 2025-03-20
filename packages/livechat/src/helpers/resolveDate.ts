export async function resolveDate(dateInput: unknown) {
	const parseISO = await import('date-fns/parseISO').then((m) => m.default);
	if (dateInput instanceof Date) {
		return dateInput;
	}

	if (typeof dateInput === 'object' && dateInput !== null && '$date' in dateInput && typeof dateInput.$date === 'number') {
		return new Date(dateInput.$date);
	}

	if (typeof dateInput === 'string') {
		return parseISO(dateInput);
	}

	if (typeof dateInput === 'number') {
		return new Date(dateInput);
	}

	return new Date(String(dateInput));
}
