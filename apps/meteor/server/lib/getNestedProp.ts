export const getNestedProp = (customFields: Record<string, any>, property: string): unknown => {
	try {
		return property.split('.').reduce((acc, el) => acc[el], customFields);
	} catch {
		// ignore errors
	}
};
