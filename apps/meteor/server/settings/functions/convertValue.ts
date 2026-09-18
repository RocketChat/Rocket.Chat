import type { ISetting, SettingValue, SettingValueMultiSelect } from '@rocket.chat/core-typings';

const parseIntegerValue = (value: string): number => {
	const parsed = Number(value);

	if (value.trim() === '' || !Number.isSafeInteger(parsed)) {
		throw new Error(`Invalid integer value "${value}"`);
	}

	return parsed;
};

export const convertValue = (value: 'true' | 'false' | string, type: ISetting['type']): SettingValue => {
	if (value.toLowerCase() === 'true') {
		return true;
	}
	if (value.toLowerCase() === 'false') {
		return false;
	}
	if (type === 'int' || type === 'timespan') {
		return parseIntegerValue(value);
	}
	if (type === 'multiSelect' || type === 'multiLookup') {
		const parsed: unknown = JSON.parse(value);
		if (!Array.isArray(parsed)) {
			throw new Error(`Expected an array but got ${typeof parsed}`);
		}
		return parsed as SettingValueMultiSelect;
	}
	return value;
};
