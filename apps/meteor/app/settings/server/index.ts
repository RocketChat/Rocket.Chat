import { Settings } from '@rocket.chat/models';

import { SettingsRegistry } from './SettingsRegistry';
import { initializeSettings } from './startup';
import { settings } from './cached';
import './applyMiddlewares';
import { use } from './Middleware';

export { SettingsEvents } from './SettingsRegistry';

export { settings };

export const settingsRegistry = new SettingsRegistry({ store: settings, model: Settings });

settingsRegistry.add = use(settingsRegistry.add, (context, next) => {
	return Promise.await(next(...context)) as any;
});

settingsRegistry.addGroup = use(settingsRegistry.addGroup, (context, next) => {
	return Promise.await(next(...context)) as any;
});

Promise.await(initializeSettings({ model: Settings, settings }));
