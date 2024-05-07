import { Settings } from '@rocket.chat/models';

import { use } from './Middleware';
import { SettingsRegistry } from './SettingsRegistry';
import { settings } from './cached';
import { initializeSettings } from './startup';
import './applyMiddlewares';

export { SettingsEvents } from './SettingsRegistry';

export { settings };

export const settingsRegistry = new SettingsRegistry({ store: settings, model: Settings });

settingsRegistry.add = use(settingsRegistry.add, async (context, next) => {
	return next(...context) as any;
});

settingsRegistry.addGroup = use(settingsRegistry.addGroup, async (context, next) => {
	return next(...context) as any;
});

await initializeSettings({ model: Settings, settings });
