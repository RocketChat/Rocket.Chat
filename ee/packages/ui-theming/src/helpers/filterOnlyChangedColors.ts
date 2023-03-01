export const filterOnlyChangedColors = (
	originalValues: Record<string, string>,
	newValues: Record<string, string>,
): Record<string, string> => Object.fromEntries(Object.entries(newValues).filter(([key, value]) => value !== originalValues[key]));
