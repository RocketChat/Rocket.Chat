import { performance } from 'universal-perf-hooks';

import { callbacks } from '../../lib/callbacks';
import { getConfig } from '../lib/utils/getConfig';

if ([getConfig('debug'), getConfig('timed-callbacks')].includes('true')) {
	callbacks.setMetricsTrackers({
		trackCallback: ({ hook, id, stack }) => {
			const start = performance.now();

			return (): void => {
				const end = performance.now();
				console.log(String(end - start), hook, id, stack?.split('\n')?.[2]?.match(/\(.+\)/)?.[0]);
			};
		},
		trackHook: ({ hook }) => {
			const start = performance.now();

			return (): void => {
				const end = performance.now();
				console.log(`${hook}:`, end - start);
			};
		},
	});
}
