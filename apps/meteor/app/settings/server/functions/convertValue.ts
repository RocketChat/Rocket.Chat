import { ISetting, SettingValue } from '@rocket.chat/core-typings';

export const convertValue = (value: 'true' | 'false' | string, type: ISetting['type']): SettingValue => {
	if (value.toLowerCase() === 'true') {
		return true;
	}
	if (value.toLowerCase() === 'false') {
		return false;
	}
	if (type === 'int') {
		return parseInt(value);
	}
	return value;
};
