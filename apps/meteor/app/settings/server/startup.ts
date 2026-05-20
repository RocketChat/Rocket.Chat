import type { ISetting } from '@rocket.chat/core-typings';
import type { Settings } from '@rocket.chat/models';
import { performance } from 'universal-perf-hooks';

import type { ICachedSettings } from './CachedSettings';
import { sinceBoot } from '../../../server/lib/logger/bootStart';
import { SystemLogger } from '../../../server/lib/logger/system';

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function initializeSettings({ model, settings }: { model: typeof Settings; settings: ICachedSettings }): Promise<void> {
	SystemLogger.startup({ msg: 'Initializing settings (DB hydration)', sinceBootMs: sinceBoot() });
	const start = performance.now();

	let count = 0;
	await model.find().forEach((record: ISetting) => {
		settings.set(record);
		count++;
	});

	settings.initialized();

	SystemLogger.startup({
		msg: 'Settings DB hydration done',
		elapsedMs: Math.round(performance.now() - start),
		sinceBootMs: sinceBoot(),
		count,
	});
}
