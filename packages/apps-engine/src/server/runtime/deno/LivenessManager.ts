import type { ChildProcess } from 'child_process';
import { EventEmitter } from 'stream';

import type { DenoRuntimeSubprocessController } from './AppsEngineDenoRuntime';
import type { ProcessMessenger } from './ProcessMessenger';

export const COMMAND_PING = '_zPING';

const defaultOptions: LivenessManager['options'] = {
	pingTimeoutInMS: 1000,
	pingIntervalInMS: 10000,
	consecutiveTimeoutLimit: 4,
	maxRestarts: Infinity,
	restartAttemptDelayInMS: 1000,
};

/**
 * Responsible for pinging the Deno subprocess and for restarting it
 * if something doesn't look right
 */
export class LivenessManager {
	private readonly controller: DenoRuntimeSubprocessController;

	private readonly messenger: ProcessMessenger;

	private readonly debug: debug.Debugger;

	private readonly options: {
		// How long should we wait for a response to the ping request
		pingTimeoutInMS: number;

		// How long is the delay between ping messages
		pingIntervalInMS: number;

		// Limit of times the process can timeout the ping response before we consider it as unresponsive
		consecutiveTimeoutLimit: number;

		// Limit of times we can try to restart a process
		maxRestarts: number;

		// Time to delay the next restart attempt after a failed one
		restartAttemptDelayInMS: number;
	};

	private subprocess: ChildProcess;

	private watchdogTimeout: NodeJS.Timeout | null = null;

	private lastHeartbeatTimestamp = NaN;

	// A promise tracking the current ping process - used mostly for testing
	private pendingPing: Promise<boolean> | null;

	// This is the perfect use-case for an AbortController, but it's experimental in Node 14.x
	private pingAbortController: EventEmitter;

	private pingTimeoutConsecutiveCount = 0;

	private restartCount = 0;

	private restartLog: Record<string, unknown>[] = [];

	constructor(
		deps: {
			controller: DenoRuntimeSubprocessController;
			messenger: ProcessMessenger;
			debug: debug.Debugger;
		},
		options: Partial<LivenessManager['options']> = {},
	) {
		this.controller = deps.controller;
		this.messenger = deps.messenger;
		this.debug = deps.debug;
		this.pingAbortController = new EventEmitter();

		this.options = Object.assign({}, defaultOptions, options);

		this.controller.on('heartbeat', () => {
			this.lastHeartbeatTimestamp = Date.now();
			this.pingTimeoutConsecutiveCount = 0;
		});

		this.controller.on('error', async (reason) => {
			if (reason instanceof Error && reason.message.startsWith('DECODE_ERROR')) {
				await this.restartProcess('Decode error', 'controller');
			}
		});
	}

	public getRuntimeData() {
		const { lastHeartbeatTimestamp, restartCount, pingTimeoutConsecutiveCount, restartLog } = this;

		return {
			lastHeartbeatTimestamp,
			restartCount,
			pingTimeoutConsecutiveCount,
			restartLog,
		};
	}

	public attach(deno: ChildProcess) {
		this.subprocess = deno;

		this.pingTimeoutConsecutiveCount = 0;

		this.subprocess.once('exit', this.handleExit.bind(this));
		this.subprocess.once('error', this.handleError.bind(this));

		this.controller.once('constructed', this.start.bind(this));
	}

	public start() {
		this.lastHeartbeatTimestamp = Date.now();

		this.watchdogTimeout = setInterval(() => {
			if (Date.now() - this.lastHeartbeatTimestamp < this.options.pingIntervalInMS) {
				return;
			}

			try {
				this.ping();
			} catch {
				// If the ping call fails synchronously, it's because we couldn't send the ping message
				// then likely the process isn't running, so we stop everything
				this.debug('[LivenessManager] Failed to send ping to subprocess, stopping watchdog...');
				this.stop();
			}
		}, this.options.pingIntervalInMS);

		this.watchdogTimeout.unref();
	}

	public stop() {
		this.pingAbortController.emit('abort');
		clearInterval(this.watchdogTimeout);
		this.watchdogTimeout = null;
		this.pendingPing = null;
	}

	public getPendingPing() {
		return this.pendingPing;
	}

	/**
	 * Start up the process of ping/pong for liveness check
	 *
	 * The message exchange does not use JSON RPC as it adds a lot of overhead
	 * with the creation and encoding of a full object for transfer. By using a
	 * string the process is less intensive.
	 */
	private ping() {
		const start = Date.now();

		this.pendingPing = new Promise<boolean>((resolve, reject) => {
			const onceCallback = () => {
				const now = Date.now();
				this.debug('Ping successful in %d ms', now - start);
				clearTimeout(timeoutId);
				this.pingTimeoutConsecutiveCount = 0;
				this.lastHeartbeatTimestamp = now;
				resolve(true);
			};

			const timeoutCallback = () => {
				this.debug('Ping failed in %d ms (consecutive failure #%d)', Date.now() - start, this.pingTimeoutConsecutiveCount);
				this.controller.off('pong', onceCallback);
				this.pingTimeoutConsecutiveCount++;
				reject('timeout');
			};

			this.pingAbortController.once('abort', () => {
				this.debug('Ping aborted');
				reject('abort');
			});

			const timeoutId = setTimeout(timeoutCallback, this.options.pingTimeoutInMS);

			this.controller.once('pong', onceCallback);
		})
			.catch((reason) => {
				if (reason === 'abort') {
					return false;
				}

				if (reason === 'timeout' && this.pingTimeoutConsecutiveCount >= this.options.consecutiveTimeoutLimit) {
					this.debug(
						'Subprocess failed to respond to pings %d consecutive times. Attempting restart...',
						this.options.consecutiveTimeoutLimit,
					);
					this.restartProcess('Too many pings timed out');
					return false;
				}

				return true;
			})
			.finally(() => {
				this.pingAbortController.removeAllListeners('abort');
			});

		this.messenger.send(COMMAND_PING);
	}

	private handleError(err: Error) {
		this.debug('App has failed to start.`', err);
		this.restartProcess(err.message);
	}

	private handleExit(exitCode: number, signal: string) {
		const processState = this.controller.getProcessState();
		// If the we're restarting the process, or want to stop the process, or it exited cleanly, nothing else for us to do
		if (processState === 'restarting' || processState === 'stopped' || (exitCode === 0 && !signal)) {
			return;
		}

		let reason: string;

		// Otherwise we attempt to restart the process
		if (signal) {
			this.debug('App has been killed (%s). Attempting restart #%d...', signal, this.restartCount + 1);
			reason = `App has been killed with signal ${signal}`;
		} else {
			this.debug('App has exited with code %d. Attempting restart #%d...', exitCode, this.restartCount + 1);
			reason = `App has exited with code ${exitCode}`;
		}

		this.restartProcess(reason);
	}

	private async restartProcess(reason: string, source = 'liveness-manager') {
		this.stop();

		if (this.restartCount >= this.options.maxRestarts) {
			this.debug('Limit of restarts reached (%d). Aborting restart...', this.options.maxRestarts);
			this.controller.stopApp();
			return;
		}

		this.restartLog.push({
			reason,
			source,
			restartedAt: new Date(),
			pid: this.subprocess.pid,
		});

		try {
			await this.controller.restartApp();
		} catch (e) {
			this.debug('Restart attempt failed. Retrying in %dms', this.options.restartAttemptDelayInMS);
			setTimeout(() => this.restartProcess('Failed restart attempt'), this.options.restartAttemptDelayInMS);
		}

		this.restartCount++;
	}
}
