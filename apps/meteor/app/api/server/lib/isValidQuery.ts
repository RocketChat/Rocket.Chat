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

export const verifyQuery = (query: Query, allowedAttributes: string[], allowedOperations: string[], parent = ''): boolean => {
	return Object.entries(removeDangerousProps(query)).every(([key, value]) => {
		const path = parent ? `${parent}.${key}` : key;
		if (parent === '' && path.startsWith('$')) {
			if (!allowedOperations.includes(path)) {
				isValidQuery.errors.push(`Invalid operation: ${path}`);
				return false;
			}
			if (!Array.isArray(value)) {
				isValidQuery.errors.push(`Invalid parameter for operation: ${path} : ${value}`);
				return false;
			}
			return value.every((v) => verifyQuery(v, allowedAttributes, allowedOperations));
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
