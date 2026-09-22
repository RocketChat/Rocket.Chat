const DANGEROUS_PROPERTIES = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Converts a flat object with dot-delimited property paths into a deeply nested object hierarchy.
 *
 * @param object - The flat object containing dot-notation paths as keys.
 * @returns A new deeply nested object with reconstructed hierarchy.
 */
export function convertPathsIntoSubObjects(object: Record<string, any>): Record<string, any> {
	const newObject: Record<string, any> = {};

	for (const key of Object.keys(object)) {
		const value = object[key];
		if (value === undefined) {
			continue;
		}

		const keyProperties = key.split('.');
		if (!keyProperties.length) {
			continue;
		}

		if (keyProperties.some((prop) => DANGEROUS_PROPERTIES.has(prop))) {
			continue;
		}

		let current = newObject;

		const finalProperty = keyProperties.pop() as string;

		for (const property of keyProperties) {
			if (!(property in current) || typeof current[property] !== 'object' || current[property] === null) {
				current[property] = {};
			}

			current = current[property];
		}

		if (current[finalProperty] && typeof current[finalProperty] === 'object' && typeof value === 'object' && value !== null) {
			current[finalProperty] = {
				...value,
				...current[finalProperty],
			};
		} else {
			current[finalProperty] = value;
		}
	}

	return newObject;
}
