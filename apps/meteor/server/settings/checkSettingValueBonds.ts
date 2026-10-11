import type { ISetting } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';

const hasNumericBounds = (setting: ISetting): setting is ISetting & { minValue?: number; maxValue?: number } => {
	return setting.type === 'int' || setting.type === 'range';
};

export const checkSettingValueBounds = (setting: ISetting, value?: ISetting['value']): void => {
	if (!hasNumericBounds(setting) || !value) {
		return;
	}

	if (setting.minValue !== undefined && Number(value) < setting.minValue) {
		throw new Meteor.Error(
			'error-invalid-setting-value',
			`Value for setting ${setting._id} must be greater than or equal to ${setting.minValue}`,
			{ method: 'saveSettings' },
		);
	}

	if (setting.maxValue !== undefined && Number(value) > setting.maxValue) {
		throw new Meteor.Error(
			'error-invalid-setting-value',
			`Value for setting ${setting._id} must be less than or equal to ${setting.maxValue}`,
			{ method: 'saveSettings' },
		);
	}
};
