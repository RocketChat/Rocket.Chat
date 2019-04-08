import { callbacks } from '../../callbacks';

import { metrics } from './lib/metrics';
import StatsTracker from './lib/statsTracker';

const {
	run: originalRun,
	runItem: originalRunItem,
} = callbacks;

callbacks.run = function(hook, item, constant) {
	const rocketchatHooksEnd = metrics.rocketchatHooks.startTimer({ hook, callbacks_length: callbacks.length });

	const result = originalRun(hook, item, constant);

	rocketchatHooksEnd();

	return result;
};

callbacks.runItem = function({ callback, result, constant, hook, time }) {
	const rocketchatCallbacksEnd = metrics.rocketchatCallbacks.startTimer({ hook, callback: callback.id });

	const newResult = originalRunItem({ callback, result, constant });

	StatsTracker.timing('callbacks.time', (Date.now() - time), [`hook:${ hook }`, `callback:${ callback.id }`]);

	rocketchatCallbacksEnd();

	return newResult;
};
