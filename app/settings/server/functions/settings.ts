import SettingsModel from '../../../models/server/models/Settings';
import { CachedSettings } from '../Settingsv4';
import { SettingsRegister } from '../SettingsRegister';
import { ISetting } from '../../../../definition/ISetting';


export const settings = new CachedSettings();
SettingsModel.find().forEach((record: ISetting) => {
	settings.set(record);
});

settings.initilized();

export const settingsRegister = new SettingsRegister({ store: settings, model: SettingsModel });
