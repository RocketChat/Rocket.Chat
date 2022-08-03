import type { ISetting } from '@rocket.chat/core-typings';
import type { Settings } from '@rocket.chat/models';

import { ICachedSettings } from './CachedSettings';

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function initializeSettings({
	SettingsModel,
	settings,
}: {
	SettingsModel: typeof Settings;
	settings: ICachedSettings;
}): Promise<void> {
	await SettingsModel.find().forEach((record: ISetting) => {
		settings.set(record);
	});

	settings.initilized();
}
