export function parseCSV(csv: string, removeEmptyItems = true): string[] {
	const items = csv.split(',').map((item) => item.trim());

	if (removeEmptyItems) {
		return items.filter(Boolean);
	}

	return items;
}
