import type { ISettingsService } from '@rocket.chat/core-services';
import { ServiceClassInternal } from '@rocket.chat/core-services';
<<<<<<< HEAD
=======
import type { SettingValue } from '@rocket.chat/core-typings';
>>>>>>> develop

import { settings } from '../../../app/settings/server';

export class SettingsService extends ServiceClassInternal implements ISettingsService {
	protected name = 'settings';

<<<<<<< HEAD
	async get<T>(settingId: string): Promise<T> {
=======
	async get<T extends SettingValue>(settingId: string): Promise<T> {
>>>>>>> develop
		return settings.get<T>(settingId);
	}
}
