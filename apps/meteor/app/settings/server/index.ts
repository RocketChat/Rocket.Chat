import SettingsModel from '../../models/server/models/Settings';
import { SettingsRegistry } from './SettingsRegistry';
import { initializeSettings } from './startup';
import { settings } from './cached';
import './applyMiddlewares';

export { SettingsEvents } from './SettingsRegistry';

export { settings };

export const settingsRegistry = new SettingsRegistry({ store: settings, model: SettingsModel });

initializeSettings({ SettingsModel, settings });
