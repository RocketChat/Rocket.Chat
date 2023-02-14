import { filterOnlyChangedColors } from './filterOnlyChangedColors';

export const hasChanges = (originalValues: Record<string, string>, newValues: Record<string, string>): boolean =>
	Object.entries(filterOnlyChangedColors(originalValues, newValues)).length > 0;
