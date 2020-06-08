import { useState, useCallback } from 'react';

import { capitalize } from '../helpers/capitalize';

const getValue = (e) => (e.currentTarget ? e.currentTarget.value : e);

export const useForm = (obj) => {
	const resetCallbacks = [];
	const hasUnsavedChanges = [];
	const ret = Object.keys(obj).sort().reduce((ret, key) => {
		const value = obj[key];
		const [data, setData] = useState(value);

		ret.values = { ...ret.values, [key]: data };
		ret.handlers = { ...ret.handlers, [`handle${ capitalize(key) }`]: useCallback(typeof value !== 'boolean' ? (e) => setData(getValue(e)) : () => setData(!data), [data]) };
		hasUnsavedChanges.push(JSON.stringify(value) !== JSON.stringify(data));
		resetCallbacks.push(() => setData(value));

		return ret;
	}, {});

	ret.reset = () => {
		resetCallbacks.forEach((reset) => reset());
	};

	ret.hasUnsavedChanges = hasUnsavedChanges.filter(Boolean).length > 0;

	return ret;
};
