import type { ISetting } from '@rocket.chat/core-typings';

import { Settings } from '../../models/server/models/Settings';
import { ICachedSettings } from './CachedSettings';

// eslint-disable-next-line @typescript-eslint/naming-convention
export function initializeSettings({ SettingsModel, settings }: { SettingsModel: Settings; settings: ICachedSettings }): void {
	SettingsModel.find().forEach((record: ISetting) => {
		settings.set(record);
	});

	settings.initilized();
}
