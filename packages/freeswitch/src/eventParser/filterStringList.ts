export function filterStringList(
	object: Record<string, string | undefined>,
	filterFn: (key: string) => boolean,
): Record<string, string | undefined>;

export function filterStringList(
	object: Record<string, string | undefined>,
	filterFn: (key: string) => boolean,
	mapFn: (data: [string, string | undefined]) => [string, string] | undefined,
): Record<string, string>;

export function filterStringList(
	object: Record<string, string | undefined>,
	filterFn: (key: string) => boolean,
	mapFn?: (data: [string, string | undefined]) => [string, string | undefined] | undefined,
): Record<string, string | undefined>;

export function filterStringList(
	object: Record<string, string | undefined>,
	filterFn: (key: string) => boolean,
	mapFn?: (data: [string, string | undefined]) => [string, string | undefined] | undefined,
): Record<string, string | undefined> {
	const filteredEntries = Object.entries(object).filter(([key]) => filterFn(key));

	if (!mapFn) {
		return Object.fromEntries(filteredEntries);
	}

	const mappedEntries = filteredEntries.map(mapFn).filter((entry) => entry) as [string, string][];
	return Object.fromEntries(mappedEntries);
}
