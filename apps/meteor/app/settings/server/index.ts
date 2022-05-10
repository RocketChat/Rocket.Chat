import SettingsModel from '../../models/server/models/Settings';
import { CachedSettings } from './CachedSettings';
import { SettingsRegistry } from './SettingsRegistry';
import { initializeSettings } from './startup';

export { SettingsEvents } from './SettingsRegistry';

export const settings = new CachedSettings();
export const settingsRegistry = new SettingsRegistry({ store: settings, model: SettingsModel });

initializeSettings({ SettingsModel, settings });
