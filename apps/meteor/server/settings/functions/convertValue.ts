import type { ISetting, SettingValue } from '@rocket.chat/core-typings';

const INTEGER_PATTERN = /^[+-]?\d+$/;

const parseIntegerValue = (value: string): number => {
	const trimmed = value.trim();

	if (!INTEGER_PATTERN.test(trimmed)) {
		throw new Error(`Invalid integer value "${value}"`);
	}

	const parsed = Number(trimmed);

	if (!Number.isSafeInteger(parsed)) {
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
	if (type === 'multiSelect') {
		return JSON.parse(value);
	}
	return value;
};
