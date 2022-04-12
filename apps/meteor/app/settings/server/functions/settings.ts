import SettingsModel from '../../../models/server/models/Settings';
import { CachedSettings } from '../CachedSettings';
import { SettingsRegistry } from '../SettingsRegistry';
import { ISetting } from '../../../../definition/ISetting';

export const settings = new CachedSettings();
SettingsModel.find().forEach((record: ISetting) => {
	settings.set(record);
});

settings.initilized();

export const settingsRegistry = new SettingsRegistry({ store: settings, model: SettingsModel });
