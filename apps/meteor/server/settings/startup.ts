import { isDeepStrictEqual } from 'node:util';

import type { ISetting } from '@rocket.chat/core-typings';
import type { Settings } from '@rocket.chat/models';

import type { ICachedSettings } from './CachedSettings';

export async function initializeSettings({ model, settings }: { model: typeof Settings; settings: ICachedSettings }): Promise<void> {
	await model.find().forEach((record: ISetting) => {
		settings.set(record);
	});

	settings.initialized();
}

// Catches up with values written to the database after the cache was loaded, without re-emitting the ones that did not change.
export async function reloadSettings({ model, settings }: { model: typeof Settings; settings: ICachedSettings }): Promise<void> {
	await model.find().forEach((record: ISetting) => {
		if (isDeepStrictEqual(settings.getSetting(record._id)?.value, record.value)) {
			return;
		}
		settings.set(record);
	});
}
