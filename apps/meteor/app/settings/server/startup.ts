import type { ISetting } from '@rocket.chat/core-typings';
import type { Settings } from '@rocket.chat/models';
import { performance } from 'universal-perf-hooks';

import type { ICachedSettings } from './CachedSettings';
import { db } from '../../../server/database/utils';
import { sinceBoot } from '../../../server/lib/logger/bootStart';
import { SystemLogger } from '../../../server/lib/logger/system';

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function initializeSettings({ model, settings }: { model: typeof Settings; settings: ICachedSettings }): Promise<void> {
	SystemLogger.startup({ msg: 'Initializing settings (DB hydration)', sinceBootMs: sinceBoot() });
	const start = performance.now();

	const pingStart = performance.now();
	await db.command({ ping: 1 });
	SystemLogger.startup({
		msg: 'Mongo ping (pre-find)',
		elapsedMs: Math.round(performance.now() - pingStart),
		sinceBootMs: sinceBoot(),
	});

	const cursor = model.find();
	const cursorReady = performance.now();

	let count = 0;
	await cursor.forEach((record: ISetting) => {
		settings.set(record);
		count++;
	});
	const cursorDone = performance.now();
	SystemLogger.startup({
		msg: 'Settings cursor exhausted',
		elapsedMs: Math.round(cursorDone - cursorReady),
		sinceBootMs: sinceBoot(),
		count,
	});

	const pingPostStart = performance.now();
	await db.command({ ping: 1 });
	SystemLogger.startup({
		msg: 'Mongo ping (post-find)',
		elapsedMs: Math.round(performance.now() - pingPostStart),
		sinceBootMs: sinceBoot(),
	});

	settings.initialized();
	const initializedDone = performance.now();
	SystemLogger.startup({
		msg: 'Settings ready event fired',
		elapsedMs: Math.round(initializedDone - cursorDone),
		sinceBootMs: sinceBoot(),
	});

	SystemLogger.startup({
		msg: 'Settings DB hydration done',
		elapsedMs: Math.round(performance.now() - start),
		sinceBootMs: sinceBoot(),
		count,
	});
}
