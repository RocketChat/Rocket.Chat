import type { ISetting } from '@rocket.chat/core-typings';

import { Settings } from '../../models/server/models/Settings';
import { ICachedSettings } from './CachedSettings';

export function initializeSettings({ SettingsModel, settings }: { SettingsModel: Settings; settings: ICachedSettings }): void {
	SettingsModel.find().forEach((record: ISetting) => {
		if (record._id.startsWith('Prometheus')) {
			console.log('store cache', record);
		}
		settings.set(record);
	});

	settings.initilized();
}
