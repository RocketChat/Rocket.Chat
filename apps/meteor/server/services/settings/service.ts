import type { ISettingsService } from '@rocket.chat/core-services';
import { ServiceClassInternal } from '@rocket.chat/core-services';
import type { SettingValue } from '@rocket.chat/core-typings';

import { settings } from '../../../app/settings/server';
import * as initSettings from '../../settings';

// import { Settings } from '@rocket.chat/models';
// import { settings, settingsRegistry, initializeSettings, use } from '../../../app/settings/server';

export class SettingsService extends ServiceClassInternal implements ISettingsService {
	protected name = 'settings';

	async created(): Promise<void> {
		// settingsRegistry.add = use(settingsRegistry.add, async (context, next) => {
		// 	return next(...context) as any;
		// });
		// settingsRegistry.addGroup = use(settingsRegistry.addGroup, async (context, next) => {
		// 	return next(...context) as any;
		// });
		// await initializeSettings({ model: Settings, settings });
	}

	async started(): Promise<void> {
		await Promise.all(Object.values(initSettings).map((setting) => setting()));
	}

	async get<T extends SettingValue>(settingId: string): Promise<T> {
		return settings.get<T>(settingId);
	}
}
