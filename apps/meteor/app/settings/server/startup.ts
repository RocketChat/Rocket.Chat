import type { ISetting } from '@rocket.chat/core-typings';
import type { Settings } from '@rocket.chat/models';

import type { ICachedSettings } from './CachedSettings';

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function initializeSettings({ model, settings }: { model: typeof Settings; settings: ICachedSettings }): Promise<void> {
	// action type settings don't have any value to change, neither should they change
	await model.find({ type: { $ne: 'action' } }).forEach((record: ISetting) => {
		settings.set(record);
	});

	settings.initialized();
}
