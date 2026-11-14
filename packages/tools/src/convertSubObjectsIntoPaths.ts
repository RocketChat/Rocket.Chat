import { isRecord } from './isRecord.js';

export function convertSubObjectsIntoPaths(object: Record<string, any>, parentPath?: string): Record<string, any> {
	return Object.fromEntries(
		Object.keys(object).flatMap((key) => {
			const value = object[key];
			const fullKey = parentPath ? `${parentPath}.${key}` : key;

			if (isRecord(value)) {
				const flattened = convertSubObjectsIntoPaths(value, fullKey);

				return Object.entries(flattened);
			}
			return [[fullKey, value]];
		}),
	);
}
