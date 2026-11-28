import type { SettingValue } from '@rocket.chat/core-typings';
import { Settings } from '@rocket.chat/models';

const cache = new Map();

export const setValue = (_id: string, value: SettingValue) => cache.set(_id, value);

const setFromDB = async (_id: string) => {
	const setting = await Settings.findOneById(_id, { projection: { value: 1 } });
	if (!setting) {
		return;
	}

	setValue(_id, setting.value);

	return setting.value;
};

export const getValue = async (_id: string) => {
	if (!cache.has(_id)) {
		return setFromDB(_id);
	}

	// oxlint-disable-next-line typescript/no-unsafe-return -- the cache holds values of every setting type
	return cache.get(_id);
};

export const updateValue = <T extends { value: SettingValue }>(id: string, fields: T) => {
	if (typeof fields.value === 'undefined') {
		return;
	}
	setValue(id, fields.value);
};
