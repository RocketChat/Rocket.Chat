import Settings from '../../models/server/models/Settings';

const cache = new Map();

export const setValue = (_id, value) => cache.set(_id, value);

const setFromDB = async (_id) => {
	const setting = Settings.findOneById(_id, { fields: { value: 1 } });
	if (!setting) {
		return;
	}

	setValue(_id, setting.value);

	return setting.value;
};

export const getValue = async (_id) => {
	if (!cache.has(_id)) {
		return setFromDB(_id);
	}

	return cache.get(_id);
};

export const updateValue = (id, fields) => {
	if (typeof fields.value === 'undefined') {
		return;
	}
	setValue(id, fields.value);
};
