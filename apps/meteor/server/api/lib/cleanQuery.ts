type Query = { [k: string]: any };

const denyList = ['constructor', '__proto__', 'prototype'];

export const removeDangerousProps = (v: Query): Query => {
	const query: Query = Object.create(null);
	for (const key in v) {
		if (Object.hasOwn(v, key) && !denyList.includes(key)) {
			query[key] = v[key];
		}
	}

	return query;
};
/* @deprecated */
export function clean(v: Query, allowList: string[] = []): Query {
	const typedParam = removeDangerousProps(v);
	if (v instanceof Object) {
		for (const key in typedParam) {
			if (key.startsWith('$') && !allowList.includes(key)) {
				delete typedParam[key];
			} else {
				clean(typedParam[key], allowList);
			}
		}
	}
	return typedParam;
}
