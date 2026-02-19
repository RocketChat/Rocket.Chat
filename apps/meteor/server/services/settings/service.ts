import type { ISettingsService } from '@rocket.chat/core-services';
import { ServiceClassInternal } from '@rocket.chat/core-services';
import type { SettingValue } from '@rocket.chat/core-typings';
import { Settings } from '@rocket.chat/models';

import { notifyOnSettingChangedById } from '../../../app/lib/server/lib/notifyListener';
import { settings } from '../../../app/settings/server';
import { verifyFingerPrint } from '../../settings/misc';

export class SettingsService extends ServiceClassInternal implements ISettingsService {
	protected name = 'settings';

	async get<T extends SettingValue>(settingId: string): Promise<T> {
		return settings.get<T>(settingId);
	}

	async set<T extends SettingValue>(settingId: string, value: T): Promise<void> {
		const update = await Settings.updateValueById(settingId, value);
		if (update.modifiedCount) {
			void notifyOnSettingChangedById(settingId);
		}
	}

	override async started() {
		settings.change('Site_Url', () => {
			void verifyFingerPrint();
		});
	}
}
