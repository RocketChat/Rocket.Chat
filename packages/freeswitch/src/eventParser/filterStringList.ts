import type { EventData } from './parseEventData';

export function filterStringList(
	object: EventData,
	filterFn: (key: string) => boolean,
	mapFn?: (data: [string, string | string[] | undefined]) => [string, string | string[] | undefined] | undefined,
): EventData {
	const filteredEntries = Object.entries(object).filter(([key]) => filterFn(key));

	if (!mapFn) {
		return Object.fromEntries(filteredEntries) as EventData;
	}

	const mappedEntries = filteredEntries.map(mapFn).filter((entry) => entry) as [string, string][];
	return Object.fromEntries(mappedEntries);
}
