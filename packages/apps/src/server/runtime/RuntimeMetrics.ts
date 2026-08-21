/**
 * Direction of a message crossing the boundary between an app's runtime
 * (the subprocess) and the host (the Apps-Engine on the server):
 *
 * - `inbound`: data flowing from the runtime into the host (subprocess stdout)
 * - `outbound`: data flowing from the host into the runtime (subprocess stdin)
 */
export type RuntimeThroughputDirection = 'inbound' | 'outbound';

/**
 * Sink for runtime observability signals produced by the subprocess controllers.
 *
 * The Apps-Engine package must stay decoupled from the host's metrics backend
 * (e.g. Prometheus) so it can keep running standalone and, eventually, as a
 * separate microservice. The host injects a concrete implementation through
 * {@link IAppManagerDeps.runtimeMetrics}; when none is provided the no-op
 * reporter below is used and no measurements are taken.
 */
export interface IAppsRuntimeMetrics {
	/**
	 * Records the number of bytes that crossed the boundary between an app's
	 * runtime and the host, so the host can expose the throughput of that
	 * channel.
	 *
	 * @param appId - the app whose runtime produced/consumed the data
	 * @param direction - which way the data flowed across the boundary
	 * @param bytes - size of the (encoded) message in bytes
	 */
	observeThroughput(appId: string, direction: RuntimeThroughputDirection, bytes: number): void;
}

/**
 * Default reporter used when the host does not inject a metrics backend.
 * Every observation is discarded.
 */
export const noopRuntimeMetrics: IAppsRuntimeMetrics = {
	observeThroughput() {
		// no-op
	},
};
