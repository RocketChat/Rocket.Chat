/**
 * Direction of a message crossing the boundary between an app's runtime
 * (the subprocess) and the host (the Apps-Engine on the server):
 *
 * - `inbound`: data flowing from the runtime into the host (subprocess stdout)
 * - `outbound`: data flowing from the host into the runtime (subprocess stdin)
 */
export type RuntimeThroughputDirection = 'inbound' | 'outbound';

/**
 * A measurement of data crossing the boundary between an app's runtime and the
 * host, reported to {@link IAppsRuntimeMetrics.observeThroughput}.
 */
export type RuntimeThroughput = {
	/** The app whose runtime produced/consumed the data. */
	appId: string;
	/** Human-readable name of the app, for readability alongside `appId`. */
	appName: string;
	/** Version of the app the runtime is executing. */
	appVersion: string;
	/** Version of the `@rocket.chat/apps` package hosting the runtime boundary. */
	engineVersion: string;
	/** The platform runtime backing the subprocess (e.g. `deno`, `node`). */
	runtime: string;
	/** Which way the data flowed across the boundary. */
	direction: RuntimeThroughputDirection;
	/** Size of the (encoded) message in bytes. */
	bytes: number;
};

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
	 */
	observeThroughput(throughput: RuntimeThroughput): void;
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
