type Query = { [k: string]: any };

const denyList = ['constructor', '__proto__', 'prototype'];

export const removeDangerousProps = (v: Query): Query => {
	const query = Object.create(null);
	for (const key in v) {
		if (v.hasOwnProperty(key) && !denyList.includes(key)) {
			query[key] = v[key];
		}
	}

	return query;
};
