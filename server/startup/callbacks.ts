import { performance } from 'universal-perf-hooks';

import { callbacks } from '../../lib/callbacks';
import { Logger } from '../lib/logger/Logger';
import { metrics, StatsTracker } from '../../app/metrics';

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
			// eslint-disable-next-line @typescript-eslint/camelcase
			callbacks_length: length,
		});
	},
});
