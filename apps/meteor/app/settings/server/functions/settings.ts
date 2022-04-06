import type { ISetting } from '@rocket.chat/core-typings';

import SettingsModel from '../../../models/server/models/Settings';
import { CachedSettings } from '../CachedSettings';
import { SettingsRegistry } from '../SettingsRegistry';

export const settings = new CachedSettings();
SettingsModel.find().forEach((record: ISetting) => {
	settings.set(record);
});

settings.initilized();

export const settingsRegistry = new SettingsRegistry({ store: settings, model: SettingsModel });
