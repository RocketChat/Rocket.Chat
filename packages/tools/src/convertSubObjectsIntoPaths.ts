import { isRecord } from './isRecord';

export function convertSubObjectsIntoPaths(object: Record<string, any>, parentPath?: string): Record<string, any> {
	return Object.fromEntries(
		Object.keys(object).flatMap((key) => {
			const value = object[key];
			const fullKey = parentPath ? `${parentPath}.${key}` : key;

			if (isRecord(value)) {
				const flattened = convertSubObjectsIntoPaths(value, fullKey);

				return Object.keys(flattened).map((newKey) => [newKey, flattened[newKey]]);
			}
			return [[fullKey, value]];
		}) as [string, any][],
	);
}
