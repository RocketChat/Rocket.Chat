import type { ISettingsService } from '@rocket.chat/core-services';
import { ServiceClassInternal } from '@rocket.chat/core-services';

import { settings } from '../../../app/settings/server';

export class SettingsService extends ServiceClassInternal implements ISettingsService {
	protected name = 'settings';

	async get<T>(settingId: string): Promise<T> {
		return settings.get<T>(settingId);
	}
}
