import type { ISetting } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';

import { settings } from '.';
import { checkSettingValueBounds } from './checkSettingValueBonds';
import { SettingValidationError, validateSettingRules } from '../lib/settingValidationRules';

export type SettingToValidate = {
	_id: ISetting['_id'];
	value: ISetting['value'];
	setting?: ISetting;
};

export const validateSettings = (changes: SettingToValidate[]): void => {
	for (const { _id, value, setting: providedSetting } of changes) {
		const setting = providedSetting ?? settings.getSetting(_id);
		if (!setting) {
			continue;
		}

		try {
			checkSettingValueBounds(setting, value);
		} catch (error) {
			if (error instanceof Meteor.Error && error.error === 'error-invalid-setting-value') {
				throw new SettingValidationError(error.reason || error.message, _id, 'bounds');
			}
			throw error;
		}
	}

	validateSettingRules(changes);
};

export const validateSetting = (setting: ISetting, value?: ISetting['value']): void => {
	validateSettings([
		{
			_id: setting._id,
			value: value ?? setting.value,
			setting,
		},
	]);
};
