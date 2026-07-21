import type { ISetting } from '@rocket.chat/core-typings';

import { validateSettingRules } from '../lib/settingValidationRules';
import { checkSettingValueBounds } from './checkSettingValueBonds';

export const validateSetting = (setting: ISetting, value?: ISetting['value']): void => {
	checkSettingValueBounds(setting, value);
	validateSettingRules([{ _id: setting._id, value }]);
};