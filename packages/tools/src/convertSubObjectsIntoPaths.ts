import { isRecord } from './isRecord';

export function convertSubObjectsIntoPaths(object: Record<string, any>, parentPath?: string): Record<string, any> {
	return Object.fromEntries(
		Object.keys(object).flatMap((key) => {
			const value = object[key];
			const fullKey = parentPath ? `${parentPath}.${key}` : key;

			if (isRecord(value)) {
				return Object.entries(convertSubObjectsIntoPaths(value, fullKey));
			}
			return [[fullKey, value]];
		}),
	);
}
