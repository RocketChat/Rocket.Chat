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

		let current = newObject;

		const finalProperty = keyProperties.pop() as string;
		for (const property of keyProperties) {
			if (!(property in current) || typeof current[property] !== 'object' || current[property] === null) {
				current[property] = {};
			}

			current = current[property];
		}

		if (
			typeof current[finalProperty] === 'object' &&
			current[finalProperty] !== null &&
			!Array.isArray(current[finalProperty]) &&
			typeof value === 'object' &&
			value !== null &&
			!Array.isArray(value)
		) {
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
