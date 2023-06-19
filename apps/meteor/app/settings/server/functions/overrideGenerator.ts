import type { ISetting, SettingValueMultiSelect, SettingValueRoomPick } from '@rocket.chat/core-typings';

import { convertValue } from './convertValue';

const compareSettingsValue = (a: ISetting['value'], b: ISetting['value'], type?: ISetting['type']): boolean => {
	if (Array.isArray(a) && Array.isArray(b)) {
		if (type === 'multiSelect') {
			a = a as SettingValueMultiSelect;
			b = b as SettingValueMultiSelect;
			return a.length === b.length && a.every((value, index) => compareSettingsValue(value, (b as SettingValueMultiSelect)[index]));
		}

		if (type === 'roomPick') {
			a = a as SettingValueRoomPick;
			b = b as SettingValueRoomPick;
			return (
				a.length === b.length &&
				a.every((value, index) => {
					return Object.keys(value).every((key) =>
						compareSettingsValue(
							value[key as keyof typeof value],
							(b as SettingValueRoomPick)[index as keyof typeof b][key as keyof typeof b],
						),
					);
				})
			);
		}
	}
	return a === b;
};

export const overrideGenerator =
	(fn: (key: string) => string | undefined) =>
	(setting: ISetting): ISetting => {
		const overwriteValue = fn(setting._id);
		if (overwriteValue === null || overwriteValue === undefined) {
			return setting;
		}

		try {
			const value = convertValue(overwriteValue, setting.type);

			if (compareSettingsValue(value, setting.value, setting.type)) {
				return setting;
			}

			return {
				...setting,
				value,
				processEnvValue: value,
				valueSource: 'processEnvValue',
			};
		} catch (error) {
			console.error(`Error converting value for setting ${setting._id} expected "${setting.type}" type`);
			return setting;
		}
	};
