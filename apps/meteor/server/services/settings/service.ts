import type { ISettingsService } from '@rocket.chat/core-services';
import { ServiceClassInternal } from '@rocket.chat/core-services';
import type { SettingValue } from '@rocket.chat/core-typings';

import { settings } from '../../../app/settings/server';

export class SettingsService extends ServiceClassInternal implements ISettingsService {
	protected name = 'settings';

	async get<T extends SettingValue>(settingId: string): Promise<T> {
		return settings.get<T>(settingId);
	}
}
