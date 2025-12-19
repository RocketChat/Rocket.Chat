import { removeDangerousProps } from './cleanQuery';

type Query = { [k: string]: any };

export const isValidQuery: {
	(query: Query, allowedAttributes: string[], allowedOperations: string[]): boolean;
	errors: string[];
} = Object.assign(
	(query: Query, allowedAttributes: string[], allowedOperations: string[]): boolean => {
		isValidQuery.errors = [];
		if (!(query instanceof Object)) {
			throw new Error('query must be an object');
		}

		// eslint-disable-next-line @typescript-eslint/no-use-before-define
		return verifyQuery(query, allowedAttributes, allowedOperations);
	},
	{
		errors: [],
	},
);

const verifyQuery = (query: Query, allowedAttributes: string[], allowedOperations: string[], parent = ''): boolean => {
	return Object.entries(removeDangerousProps(query)).every(([key, value]) => {
		const path = parent ? `${parent}.${key}` : key;
		if (key.startsWith('$')) {
			if (!allowedOperations.includes(key)) {
				isValidQuery.errors.push(`Invalid operation: ${key}`);
				return false;
			}

			if (Array.isArray(value)) {
				return value.every((v) => verifyQuery(v, allowedAttributes, allowedOperations));
			}

			if (value instanceof Object) {
				return verifyQuery(value, allowedAttributes, allowedOperations, path);
			}

			// handles primitive values (strings, numbers, booleans, etc.)
			return true;
		}

		if (
			!allowedAttributes.some((allowedAttribute) => {
				if (allowedAttribute.endsWith('.*')) {
					return path.startsWith(allowedAttribute.replace('.*', ''));
				}
				if (allowedAttribute.endsWith('*') && !allowedAttribute.endsWith('.*')) {
					return true;
				}
				return path === allowedAttribute;
			})
		) {
			isValidQuery.errors.push(`Invalid attribute: ${path}`);
			return false;
		}

		if (value instanceof Object) {
			return verifyQuery(value, allowedAttributes, allowedOperations, path);
		}
		return true;
	});
};
