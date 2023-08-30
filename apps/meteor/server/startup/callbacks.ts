import { Logger } from '@rocket.chat/logger';
import { performance } from 'universal-perf-hooks';

import { metrics, StatsTracker } from '../../app/metrics/server';
import { callbacks } from '../../lib/callbacks';

callbacks.setLogger(new Logger('Callbacks'));

callbacks.setMetricsTrackers({
	trackCallback: ({ hook, id }) => {
		const start = performance.now();

		const stopTimer = metrics.rocketchatCallbacks.startTimer({ hook, callback: id });

		return (): void => {
			const end = performance.now();
			StatsTracker.timing('callbacks.time', end - start, [`hook:${hook}`, `callback:${id}`]);

			stopTimer();
		};
	},
	trackHook: ({ hook, length }) => {
		return metrics.rocketchatHooks.startTimer({
			hook,
			callbacks_length: length,
		});
	},
});
