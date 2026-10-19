import type { ISetting, SettingValue } from '@rocket.chat/core-typings';

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
	if (type === 'multiSelect' || type === 'multiLookup') {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-return -- setting values are untyped at this layer
		return JSON.parse(value);
	}
	return value;
};
