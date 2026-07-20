import * as path from 'node:path';

import debugFactory from 'debug';

import { loadWattRuntime } from './loadWattRuntime';
import { WATT_MESSAGE_COMMAND, type WattRuntime, type WattApplicationDefinition, type WattRuntimeModule } from './WattRuntimeApi';
import type { WattRuntimeController } from './WattRuntimeController';
import type { AppManager } from '../../AppManager';
import { AppConsole } from '../../logging';
import type { AppLogStorage } from '../../storage';

/**
 * Watt emits a worker message as `application:worker:message` carrying the
 * originating application id and the message payload. This is the single seam
 * where the runtime's inter-thread channel is bound to our JSON-RPC dispatch.
 */
const WATT_WORKER_MESSAGE_EVENT = 'application:worker:message';

type WattRuntimeOptions = {
	// Limit of automatic restarts before an app is given up on (per app)
	maxRestarts: number;
	// Delay before retrying a restart that failed
	restartAttemptDelayInMS: number;
	// How often Watt metrics are pulled and fanned out to the controllers
	metricsIntervalInMS: number;
	// Worker health thresholds handed to Watt so it can flag unhealthy workers
	health: {
		maxELU: number;
		maxHeapUsed: number;
	};
	// Loader for the Watt runtime module; overridable for testing
	loadRuntime?: () => Promise<WattRuntimeModule>;
};

const defaultOptions: WattRuntimeOptions = {
	maxRestarts: Infinity,
	restartAttemptDelayInMS: 1000,
	metricsIntervalInMS: 10000,
	health: {
		maxELU: 0.98,
		maxHeapUsed: 0.99,
	},
};

/**
 * Manages Rocket.Chat apps through a single Platformatic Watt runtime instead of
 * spawning one Node `child_process` per app.
 *
 * A single Watt instance hosts every app as an *application* running in its own
 * Worker Thread, which makes this class a process-wide singleton (one per
 * {@link AppManager}). Unlike the subprocess runtime, liveness and restarts are
 * delegated to Watt's own worker supervision (health checks + worker lifecycle
 * events) rather than the {@link LivenessManager}, and metrics come straight from
 * Watt's `getMetrics` API.
 *
 * Each app still gets a lightweight {@link WattRuntimeController} that speaks the
 * same JSON-RPC protocol as before; this class is only the shared transport and
 * lifecycle owner the controllers delegate to.
 */
export class AppsEngineWattRuntime {
	private static instances = new WeakMap<AppManager, AppsEngineWattRuntime>();

	/**
	 * Returns the shared Watt runtime for a given manager, creating it on first
	 * use. All apps on the same server share one Watt instance.
	 */
	public static getInstance(manager: AppManager, options?: Partial<WattRuntimeOptions>): AppsEngineWattRuntime {
		let instance = AppsEngineWattRuntime.instances.get(manager);

		if (!instance) {
			instance = new AppsEngineWattRuntime(manager, options);
			AppsEngineWattRuntime.instances.set(manager, instance);
		}

		return instance;
	}

	private readonly debug = debugFactory('appsEngine:runtime:watt');

	private readonly options: WattRuntimeOptions;

	private readonly logStorage: AppLogStorage;

	private readonly controllers = new Map<string, WattRuntimeController>();

	private readonly restartCounts = new Map<string, number>();

	private readonly latestMetrics = new Map<string, unknown>();

	private runtime: WattRuntime | undefined;

	// Serializes the (idempotent) runtime bootstrap so concurrent app starts
	// share a single Watt instance
	private runtimePromise: Promise<WattRuntime> | undefined;

	private metricsTimer: NodeJS.Timeout | undefined;

	private constructor(manager: AppManager, options: Partial<WattRuntimeOptions> = {}) {
		this.options = { ...defaultOptions, ...options };
		this.logStorage = manager.getLogStorage();
	}

	/**
	 * Absolute path to the shared Watt worker entrypoint. The app source itself is
	 * not loaded from disk here - it travels over the JSON-RPC `app:construct`
	 * call, exactly like the subprocess runtime.
	 */
	private getWorkerEntrypoint(): string {
		return require.resolve('../../../../watt-runtime/dist/main.js');
	}

	/**
	 * Directory used as both the runtime root and each application's root.
	 */
	private getWorkerRoot(): string {
		return path.resolve(path.dirname(this.getWorkerEntrypoint()), '..');
	}

	private buildApplicationDefinition(appId: string): WattApplicationDefinition {
		return {
			id: appId,
			path: this.getWorkerRoot(),
			config: {
				// A generic Node.js application whose entrypoint runs the shared
				// Apps-Engine worker loop over Watt's inter-thread channel.
				module: '@platformatic/node',
				node: {
					main: this.getWorkerEntrypoint(),
				},
			},
		};
	}

	private async ensureRuntime(): Promise<WattRuntime> {
		if (this.runtime) {
			return this.runtime;
		}

		if (!this.runtimePromise) {
			this.runtimePromise = this.createRuntime();
		}

		return this.runtimePromise;
	}

	private async createRuntime(): Promise<WattRuntime> {
		this.debug('Bootstrapping shared Watt runtime');

		const { create } = await (this.options.loadRuntime ?? loadWattRuntime)();

		const runtime = await create(this.getWorkerRoot(), {
			watch: false,
			// Watt supervises workers and restarts them on crash; we still cap and
			// log restarts ourselves through the worker lifecycle events below.
			restartOnError: true,
			health: {
				enabled: true,
				maxELU: this.options.health.maxELU,
				maxHeapUsed: this.options.health.maxHeapUsed,
			},
			metrics: { enabled: true },
			applications: [],
		});

		this.wireRuntimeEvents(runtime);

		await runtime.start();

		this.runtime = runtime;
		this.startMetricsCollection();

		return runtime;
	}

	private wireRuntimeEvents(runtime: WattRuntime): void {
		// Inbound app -> host messages (accessor/bridge calls, results, logs,
		// ready/pong, metrics). This replaces the subprocess `on('message')` seam.
		runtime.on(WATT_WORKER_MESSAGE_EVENT, ({ application, message }: { application: string; message: unknown }) => {
			this.controllers.get(application)?.handleRuntimeMessage(message);
		});

		// Worker supervision - this is what stands in for the LivenessManager.
		runtime.on('application:worker:error', ({ application, error }: { application: string; error?: Error }) => {
			this.debug('Worker for app %s errored: %s', application, error?.message);
			void this.handleWorkerFailure(application, `Worker error: ${error?.message ?? 'unknown'}`);
		});

		runtime.on('application:worker:unhealthy', ({ application }: { application: string }) => {
			this.debug('Worker for app %s reported unhealthy', application);
			void this.handleWorkerFailure(application, 'Worker reported unhealthy by Watt health check');
		});

		runtime.on('application:worker:exited', ({ application, code, signal }: { application: string; code?: number; signal?: string }) => {
			const controller = this.controllers.get(application);

			// A clean exit or an exit we asked for (stop/restart) needs no action.
			if (!controller || controller.isStopping() || (code === 0 && !signal)) {
				return;
			}

			this.debug('Worker for app %s exited unexpectedly (code=%s signal=%s)', application, code, signal);
			void this.handleWorkerFailure(application, `Worker exited with ${signal ? `signal ${signal}` : `code ${code}`}`);
		});
	}

	/**
	 * Restart bookkeeping that used to live in the LivenessManager: cap the number
	 * of restarts, log every attempt against the app, and give up (stop the app)
	 * once the limit is reached.
	 */
	private async handleWorkerFailure(appId: string, reason: string): Promise<void> {
		const controller = this.controllers.get(appId);

		if (!controller || controller.isStopping()) {
			return;
		}

		const restartCount = this.restartCounts.get(appId) ?? 0;

		const logger = new AppConsole('runtime:restart');

		if (restartCount >= this.options.maxRestarts) {
			logger.error({ msg: 'Limit of restarts reached. Giving up on app.', appId, reason, restartCount });
			await this.persistLogs(appId, logger);
			await controller.stopApp();
			return;
		}

		this.restartCounts.set(appId, restartCount + 1);
		logger.warn({ msg: 'Restarting app worker', appId, reason, attempt: restartCount + 1 });

		try {
			await controller.restartApp();
			logger.info({ msg: 'App worker restarted successfully', appId });
		} catch (error) {
			logger.error({ msg: 'Failed to restart app worker, retrying', appId, err: error });
			setTimeout(() => void this.handleWorkerFailure(appId, 'Retry after failed restart'), this.options.restartAttemptDelayInMS);
		} finally {
			await this.persistLogs(appId, logger);
		}
	}

	private async persistLogs(appId: string, logger: AppConsole): Promise<void> {
		try {
			await this.logStorage.storeEntries(AppConsole.toStorageEntry(appId, logger));
		} catch (error) {
			this.debug('Failed to persist restart logs for app %s: %s', appId, error);
		}
	}

	private startMetricsCollection(): void {
		if (this.metricsTimer) {
			return;
		}

		this.metricsTimer = setInterval(() => void this.collectMetrics(), this.options.metricsIntervalInMS);
		this.metricsTimer.unref();
	}

	private async collectMetrics(): Promise<void> {
		if (!this.runtime) {
			return;
		}

		try {
			const { metrics } = await this.runtime.getMetrics('json');

			for (const entry of Array.isArray(metrics) ? metrics : []) {
				const application = (entry as { application?: string })?.application;

				if (application && this.controllers.has(application)) {
					this.latestMetrics.set(application, entry);
				}
			}
		} catch (error) {
			this.debug('Failed to collect Watt metrics: %s', error);
		}
	}

	public getMetrics(appId: string): unknown {
		return this.latestMetrics.get(appId);
	}

	/**
	 * Registers an app's controller and brings up its Worker Thread inside the
	 * shared Watt runtime.
	 */
	public async registerApp(controller: WattRuntimeController): Promise<void> {
		const appId = controller.getAppId();
		const runtime = await this.ensureRuntime();

		this.controllers.set(appId, controller);
		this.restartCounts.set(appId, 0);

		await runtime.addApplications([this.buildApplicationDefinition(appId)], true);
	}

	/**
	 * Sends a JSON-RPC envelope (or ping/pong sentinel) to an app's worker.
	 */
	public async sendToApp(appId: string, message: unknown): Promise<void> {
		const runtime = await this.ensureRuntime();
		await runtime.sendCommandToApplication(appId, WATT_MESSAGE_COMMAND, message);
	}

	/**
	 * Restarts a single app worker, delegating the worker lifecycle to Watt.
	 */
	public async restartApp(appId: string): Promise<void> {
		const runtime = await this.ensureRuntime();
		await runtime.restartApplication(appId);
	}

	/**
	 * Stops and removes an app worker from the shared runtime. When the last app
	 * goes away the runtime itself is torn down.
	 */
	public async unregisterApp(appId: string): Promise<void> {
		this.controllers.delete(appId);
		this.restartCounts.delete(appId);
		this.latestMetrics.delete(appId);

		if (this.runtime) {
			try {
				await this.runtime.stopApplication(appId);
				await this.runtime.removeApplications([appId]);
			} catch (error) {
				this.debug('Failed to remove app %s from Watt runtime: %s', appId, error);
			}
		}

		if (this.controllers.size === 0) {
			await this.shutdown();
		}
	}

	private async shutdown(): Promise<void> {
		if (this.metricsTimer) {
			clearInterval(this.metricsTimer);
			this.metricsTimer = undefined;
		}

		const runtime = this.runtime;
		this.runtime = undefined;
		this.runtimePromise = undefined;

		if (runtime) {
			this.debug('No apps left, shutting down shared Watt runtime');
			await runtime.close().catch((error) => this.debug('Error closing Watt runtime: %s', error));
		}
	}
}
