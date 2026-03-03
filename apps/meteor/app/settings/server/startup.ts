import type { Settings } from '@rocket.chat/models';

import type { ICachedSettings } from './CachedSettings';

export async function initializeSettings({ model, settings }: { model: typeof Settings; settings: ICachedSettings }): Promise<void> {
	const records = await model.find().toArray();
	for (const record of records) {
		settings.set(record);
	}
	settings.initialized();
}
