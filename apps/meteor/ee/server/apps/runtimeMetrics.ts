import type { IAppsRuntimeMetrics } from '@rocket.chat/apps/dist/server/runtime/RuntimeMetrics';

import { metrics } from '../../../server/lib/metrics';

/**
 * Bridges the Apps-Engine runtime observability signals to Rocket.Chat's
 * Prometheus registry. The Apps-Engine package stays agnostic of the metrics
 * backend and only emits measurements through this reporter, which the host
 * injects into the `AppManager`.
 *
 * The host owns the Prometheus metric, so this is also the seam where
 * host-scoped labels can be merged in (e.g. deploy metadata). Truly global
 * deploy labels are better set once via `register.setDefaultLabels()` so they
 * apply to every Rocket.Chat metric rather than this one alone.
 */
export const appsRuntimeMetrics: IAppsRuntimeMetrics = {
	observeThroughput({ appId, appName, appVersion, engineVersion, runtime, direction, bytes }) {
		metrics.appsEngineRuntimeThroughput.inc(
			{ app_id: appId, app_name: appName, version: appVersion, engine_version: engineVersion, runtime, direction },
			bytes,
		);
	},
};
