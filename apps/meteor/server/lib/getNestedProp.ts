export const getNestedProp = (customFields: Record<string, any>, property: string): unknown => {
	try {
		return property.split('.').reduce<unknown>((acc, el) => (acc as Record<string, unknown>)[el], customFields);
	} catch {
		// ignore errors
	}
};
