import { isRecord } from './isRecord';

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
			if (!(property in current) || !isRecord(current[property])) {
				current[property] = {};
			}

			current = current[property];
		}

		if (isRecord(current[finalProperty]) && isRecord(value)) {
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
