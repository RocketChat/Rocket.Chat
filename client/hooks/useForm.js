import { useState, useCallback } from 'react';

const getValue = (e) => (e.currentTarget ? e.currentTarget.value : e);

const capitalize = (s) => {
	if (typeof s !== 'string') { return ''; }
	return s.charAt(0).toUpperCase() + s.slice(1);
};

export const useForm = (obj) => {
	const resetCallbacks = [];
	const ret = Object.keys(obj).sort().reduce((ret, key) => {
		const value = obj[key];
		const [data, setData] = useState(value);

		ret.values = { ...ret.values, [key]: data };
		ret.handlers = { ...ret.handlers, [`handle${ capitalize(key) }`]: useCallback(typeof value !== 'boolean' ? (e) => setData(getValue(e)) : () => setData(!data), [data]) };
		resetCallbacks.push(() => setData(value));

		return ret;
	}, {});

	ret.reset = () => {
		resetCallbacks.forEach((reset) => reset());
	};

	return ret;
};
