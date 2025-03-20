const flatMap = <T, U>(arr: T[], mapFunc: (elem: T, index: number, arr: T[]) => U | U[]) => {
	const result = [];
	for (const [index, elem] of arr.entries()) {
		const x = mapFunc(elem, index, arr);
		// We allow mapFunc() to return non-Arrays
		if (Array.isArray(x)) {
			result.push(...x);
		} else {
			result.push(x);
		}
	}
	return result;
};

export const createClassName = (
	styles: Record<string, string>,
	elementName: string,
	modifiers = {},
	classes: (string | undefined)[] = [],
) => {
	return [
		styles[elementName],
		...flatMap(Object.entries(modifiers), ([modifierKey, modifierValue]) => [
			modifierValue && styles[`${elementName}--${modifierKey}`],
			typeof modifierValue !== 'boolean' && styles[`${elementName}--${modifierKey}-${modifierValue}`],
		]).filter((className) => !!className),
		...classes.filter((className) => !!className),
	].join(' ');
};
