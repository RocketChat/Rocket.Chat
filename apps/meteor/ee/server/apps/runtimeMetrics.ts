import type { IAppsRuntimeMetrics } from '@rocket.chat/apps/dist/server/runtime/RuntimeMetrics';

import { metrics } from '../../../server/lib/metrics';

/**
 * Bridges the Apps-Engine runtime observability signals to Rocket.Chat's
 * Prometheus registry. The Apps-Engine package stays agnostic of the metrics
 * backend and only emits measurements through this reporter, which the host
 * injects into the `AppManager`.
 */
export const appsRuntimeMetrics: IAppsRuntimeMetrics = {
	observeThroughput(appId, direction, bytes) {
		metrics.appsEngineRuntimeThroughput.inc({ app_id: appId, direction }, bytes);
	},
};
