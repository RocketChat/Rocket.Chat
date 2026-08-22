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

/** Outcome of a request sent across the boundary from the host to a runtime. */
export type RuntimeRequestStatus = 'success' | 'error';

/**
 * A completed request sent across the boundary from the host to an app's
 * runtime, reported to {@link IAppsRuntimeMetrics.observeRequestDuration}.
 */
export type RuntimeRequestDuration = {
	/** The app whose runtime handled the request. */
	appId: string;
	/** Human-readable name of the app, for readability alongside `appId`. */
	appName: string;
	/** Version of the app the runtime is executing. */
	appVersion: string;
	/** Version of the `@rocket.chat/apps` package hosting the runtime boundary. */
	engineVersion: string;
	/** The platform runtime backing the subprocess (e.g. `deno`, `node`). */
	runtime: string;
	/**
	 * Bounded identifier of the request method, safe to use as a metric label.
	 * `app:*` lifecycle/event methods keep their name; every other category
	 * (which embeds unbounded ids) is reduced to its category. See
	 * {@link normalizeRuntimeMethodLabel}.
	 */
	method: string;
	/** Whether the request resolved or rejected/timed out. */
	status: RuntimeRequestStatus;
	/** Wall-clock time the request took, in milliseconds. */
	durationMs: number;
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
	/**
	 * Records how long a request sent from the host to an app's runtime took,
	 * so the host can expose per-method request duration.
	 */
	observeRequestDuration(duration: RuntimeRequestDuration): void;
}

/**
 * Reduces a namespaced runtime request method to a bounded metric label.
 *
 * Every method sent to a runtime is namespaced as `<category>:<...>`.
 * `app:<AppMethod>` carries the bounded lifecycle/event method name, which we
 * keep for per-method granularity (e.g. `executePostMessageSent`). Every other
 * category embeds unbounded ids — api paths, slashcommand names, scheduler ids,
 * provider names — so we label by the category alone to keep cardinality
 * bounded (e.g. `api`, `slashcommand`, `scheduler`).
 */
export function normalizeRuntimeMethodLabel(method: string): string {
	const separator = method.indexOf(':');

	if (separator === -1) {
		return method;
	}

	const category = method.slice(0, separator);

	return category === 'app' ? method.slice(separator + 1) : category;
}

/**
 * Default reporter used when the host does not inject a metrics backend.
 * Every observation is discarded.
 */
export const noopRuntimeMetrics: IAppsRuntimeMetrics = {
	observeThroughput() {
		// no-op
	},
	observeRequestDuration() {
		// no-op
	},
};
