import type { ISetting } from '@rocket.chat/core-typings';
import type { Settings } from '@rocket.chat/models';

import type { ICachedSettings } from './CachedSettings';

export async function initializeSettings({ model, settings }: { model: typeof Settings; settings: ICachedSettings }): Promise<void> {
	await model.find().forEach((record: ISetting) => {
		settings.set(record);
	});

	settings.initialized();
}
