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

// Catches up with what was written to or removed from the database after the cache was loaded, without re-emitting what did not change.
export async function reloadSettings({ model, settings }: { model: typeof Settings; settings: ICachedSettings }): Promise<void> {
	// taken before reading so a setting registered meanwhile is not mistaken for a removed one
	const removed = new Set(settings.ids());

	await model.find().forEach((record: ISetting) => {
		removed.delete(record._id);
		if (settings.has(record._id) && isDeepStrictEqual(settings.getSetting(record._id)?.value, record.value)) {
			return;
		}
		settings.set(record);
	});

	for (const _id of removed) {
		settings.remove(_id);
	}
}
