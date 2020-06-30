import { Settings } from '../../models/server/raw';

const cache = new Map();

export const setValue = (_id, value) => cache.set(_id, value);

const setFromDB = async (_id) => {
	const value = await Settings.getValueById(_id);

	setValue(_id, value);

	return value;
};

export const getValue = async (_id) => {
	if (!cache.has(_id)) {
		return setFromDB(_id);
	}

	return cache.get(_id);
};
