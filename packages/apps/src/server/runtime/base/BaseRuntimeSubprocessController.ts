import * as child_process from 'node:child_process';
import * as path from 'node:path';
import { type Readable, EventEmitter } from 'node:stream';
import { inspect as utilInspect } from 'node:util';

import { AppStatus, AppStatusUtils } from '@rocket.chat/apps-engine/definition/AppStatus';
import type { AppMethod } from '@rocket.chat/apps-engine/definition/metadata';
import debugFactory from 'debug';

import { LivenessManager } from './LivenessManager';
import { ProcessMessenger } from './ProcessMessenger';
import { bundleLegacyApp } from './bundler';
import { newDecoder } from './codec';
import * as jsonrpc from '../../../lib/jsonrpc';
import type { AppManager } from '../../AppManager';
import type { AppBridges } from '../../bridges';
import { AppResourceBridge } from '../../bridges/AppResourceBridge';
import type { IParseAppPackageResult } from '../../compiler';
import { AppConsole, type ILoggerStorageEntry } from '../../logging';
import type { AppLogStorage, IAppStorageItem } from '../../storage';
import type { IRuntimeController } from '../IRuntimeController';

const inspect = (value: unknown) => utilInspect(value, { depth: 10, compact: true, breakLength: Infinity });

const COMMAND_PONG = '_zPONG';

export const JSONRPC_METHOD_NOT_FOUND = -32601;

function getRuntimeTimeout() {
	const defaultTimeout = 30000;
	const envValue = isFinite(process.env.APPS_ENGINE_RUNTIME_TIMEOUT as any)
		? Number(process.env.APPS_ENGINE_RUNTIME_TIMEOUT)
		: defaultTimeout;

	if (envValue < 0) {
		console.log('Environment variable APPS_ENGINE_RUNTIME_TIMEOUT has a negative value, ignoring...');
		return defaultTimeout;
	}

	return envValue;
}

/**
 * Resolves the absolute path to @rocket.chat/apps-engine's src/ directory.
 * Uses require.resolve so it works regardless of the runtime environment
 * (monorepo dev, Meteor bundle, standalone node_modules).
 */
export function getAppsEngineDir(): string {
	return path.dirname(require.resolve('@rocket.chat/apps-engine/package.json'));
}

type AbortFunction = (reason?: any) => void;

/**
 * Describes how to spawn a subprocess for a given platform runtime.
 */
export type ProcessConfiguration = {
	command: string;
	args: string[];
	options: child_process.SpawnOptions;
};

/**
 * Holds the platform-agnostic logic for controlling an app subprocess: spawning,
 * killing, restarting, liveness, and the full JSON-RPC message loop (bridge,
 * result and error handling).
 *
 * The only platform-specific concern - how to actually launch the subprocess for
 * a given runtime (Deno, Node, ...) - is delegated to {@link buildProcessConfiguration},
 * which specialized subclasses must implement. Any additional per-platform setup
 * (config generation, symlinks, path resolution) should happen in the subclass
 * constructor after calling `super()`.
 */
export abstract class BaseRuntimeSubprocessController extends EventEmitter implements IRuntimeController {
	private process: child_process.ChildProcess | undefined;

	private state: 'uninitialized' | 'ready' | 'invalid' | 'restarting' | 'unknown' | 'stopped';

	/**
	 * Incremental id that keeps track of how many times we've spawned a process for this app
	 */
	protected spawnId = 0;

	protected readonly debug: debug.Debugger;

	private readonly options = {
		timeout: getRuntimeTimeout(),
	};

	private readonly logStorage: AppLogStorage;

	private readonly bridges: AppBridges;

	private readonly appResourceBridge: AppResourceBridge;

	private readonly messenger: ProcessMessenger;

	private readonly livenessManager: LivenessManager;

	protected readonly tempFilePath: string;

	protected readonly appsEnginePath: string;

	constructor(
		// Human-readable name of the platform runtime (e.g. 'deno', 'node'), used for logging
		private readonly runtimeName: string,
		manager: AppManager,
		// We need to keep the appSource around in case the subprocess needs to be restarted
		protected readonly appPackage: IParseAppPackageResult,
		private readonly storageItem: IAppStorageItem,
	) {
		super();

		this.tempFilePath = manager.getTempFilePath();
		this.appsEnginePath = getAppsEngineDir();

		this.debug = debugFactory(`appsEngine:runtime:${runtimeName}`).extend(appPackage.info.id);
		this.messenger = new ProcessMessenger();
		this.livenessManager = new LivenessManager({
			controller: this,
			messenger: this.messenger,
			debug: this.debug,
		});

		this.state = 'uninitialized';

		this.logStorage = manager.getLogStorage();
		this.bridges = manager.getBridges();
		// Shared, engine-owned instance (stateless, keyed by appId per call) - one AppResourceBridge
		// serves every subprocess controller rather than each controller owning its own.
		this.appResourceBridge = manager.getAppResourceBridge();
	}

	/**
	 * Builds the command, arguments and spawn options used to launch a subprocess
	 * for the concrete platform runtime.
	 *
	 * SECURITY: implementations must ensure they fully control the command, the
	 * arguments and the script that will be executed.
	 */
	protected abstract buildProcessConfiguration(): ProcessConfiguration;

	public spawnProcess(): void {
		try {
			const { command, args, options } = this.buildProcessConfiguration();

			this.process = child_process.spawn(command, args, options);
			this.messenger.setReceiver(this.process);
			this.livenessManager.attach(this.process);

			this.debug('Started subprocess %d with options %s and env %s', this.process.pid, inspect(args), inspect(options));

			this.setupListeners();
		} catch (e) {
			this.state = 'invalid';
			console.error(`Failed to start ${this.runtimeName} subprocess for app ${this.getAppId()}`, e);
		}
	}

	/**
	 * Attempts to kill the process currently controlled by this controller
	 *
	 * @returns boolean - if a process has been killed or not
	 */
	public async killProcess(): Promise<boolean> {
		if (!this.process) {
			this.debug('No child process reference');
			return false;
		}

		let { killed } = this.process;

		// This field is not populated if the process is killed by the OS
		if (killed) {
			this.debug('App process was already killed');
			return killed;
		}

		// What else should we do?
		if (this.process.kill('SIGKILL')) {
			// Let's wait until we get confirmation the process exited
			await new Promise<void>((r) => this.process.on('exit', r));
			killed = true;
		} else {
			this.debug('Tried killing the process but failed. Was it already dead?');
			killed = false;
		}

		delete this.process;
		this.messenger.clearReceiver();
		return killed;
	}

	// Debug purposes, could be deleted later
	emit(eventName: string | symbol, ...args: any[]): boolean {
		const hadListeners = super.emit(eventName, ...args);

		if (!hadListeners) {
			this.debug('Emitted but no one listened: ', eventName, args);
		}

		return hadListeners;
	}

	public getProcessState() {
		return this.state;
	}

	public async getStatus(): Promise<AppStatus> {
		// If the process has been terminated, we can't get the status
		if (this.process?.exitCode !== null) {
			return AppStatus.UNKNOWN;
		}

		return this.sendRequest({ method: 'app:getStatus', params: [] }) as Promise<AppStatus>;
	}

	public async setupApp() {
		this.debug('Setting up app subprocess');
		this.spawnProcess();

		// If there is more than one file in the package, then it is a legacy app that has not been bundled
		if (Object.keys(this.appPackage.files).length > 1) {
			await bundleLegacyApp(this.appPackage);
		}

		await this.waitUntilReady();

		await this.sendRequest({ method: 'app:construct', params: [this.appPackage] });

		this.emit('constructed');
	}

	public async stopApp() {
		this.debug('Stopping app subprocess');

		this.state = 'stopped';

		await this.killProcess();
	}

	public async restartApp() {
		this.debug('Restarting app subprocess');
		const logger = new AppConsole('runtime:restart');

		logger.info({ msg: 'Starting restart procedure for app subprocess...', runtimeData: this.livenessManager.getRuntimeData() });

		this.state = 'restarting';

		try {
			const pid = this.process?.pid;

			const hasKilled = await this.killProcess();

			if (hasKilled) {
				logger.debug({ msg: 'Process successfully terminated', pid });
			} else {
				logger.warn({ msg: 'Could not terminate process. Maybe it was already dead?', pid });
			}

			await this.setupApp();
			logger.info({ msg: 'New subprocess successfully spawned', pid: this.process.pid });

			// setupApp() changes the state to 'ready' - we'll need to workaround that for now
			this.state = 'restarting';

			await this.sendRequest({ method: 'app:initialize' });
			await this.sendRequest({ method: 'app:setStatus', params: [this.storageItem.status] });

			if (AppStatusUtils.isEnabled(this.storageItem.status)) {
				await this.sendRequest({ method: 'app:onEnable' });
			}

			this.state = 'ready';

			logger.info('Successfully restarted app subprocess');
		} catch (e) {
			logger.error({ msg: "Failed to restart app's subprocess", err: e });
			throw e;
		} finally {
			await this.logStorage.storeEntries(AppConsole.toStorageEntry(this.getAppId(), logger));
		}
	}

	public getAppId(): string {
		return this.appPackage.info.id;
	}

	public async sendRequest(message: Pick<jsonrpc.RequestObject, 'method' | 'params'>, options = this.options): Promise<unknown> {
		const id = String(Math.random().toString(36)).substring(2);

		const start = Date.now();

		const request = jsonrpc.request(id, message.method, message.params);

		const { promise, abort } = this.waitForResponse(request, options);

		try {
			this.debug('Sending message to subprocess %s', inspect(message));
			this.messenger.send(request);
		} catch (e) {
			abort(e);
		}

		return promise.finally(() => {
			this.debug('Request %s for method %s took %dms', id, message.method, Date.now() - start);
		});
	}

	private waitUntilReady(): Promise<void> {
		if (this.state === 'ready') {
			return;
		}

		return new Promise((resolve, reject) => {
			let timeoutId: NodeJS.Timeout;

			const handler = () => {
				clearTimeout(timeoutId);
				resolve();
			};

			timeoutId = setTimeout(() => {
				this.off('ready', handler);
				reject(new Error(`[${this.getAppId()}] Timeout: app process not ready`));
			}, this.options.timeout);

			this.once('ready', handler);
		});
	}

	private waitForResponse(req: jsonrpc.RequestObject, options = this.options): { abort: AbortFunction; promise: Promise<unknown> } {
		const controller = new AbortController();
		const { abort, signal } = controller;

		return {
			abort: abort.bind(controller),
			promise: new Promise((resolve, reject) => {
				const eventName = `result:${req.id}`;

				const responseCallback = (result: unknown, error: jsonrpc.JsonRpcError | Error) => {
					this.off(eventName, responseCallback);
					clearTimeout(timeoutId);

					if (error) {
						reject(error);
					}

					resolve(result);
				};

				const timeoutId = setTimeout(
					() =>
						responseCallback(
							undefined,
							new Error(`[${this.getAppId()}] Request "${req.id}" for method "${req.method}" timed out after ${options.timeout}ms`),
						),
					options.timeout,
				);

				signal.onabort = () =>
					responseCallback(undefined, signal.reason instanceof Error ? signal.reason : new Error(String(signal.reason)));

				this.once(eventName, responseCallback);
			}),
		};
	}

	private onReady(): void {
		this.state = 'ready';
	}

	/**
	 * Listeners need to be setup every time the reference
	 * in `this.process` changes, i.e. every time the subprocess
	 * is restarted
	 */
	private setupListeners(): void {
		if (!this.process) {
			return;
		}

		this.process.stderr.on('data', this.parseError.bind(this));
		this.process.on('error', (err) => {
			this.state = 'invalid';
			console.error(`Failed to startup ${this.runtimeName} subprocess for app ${this.getAppId()}`, err);
		});

		this.process.once('exit', (code) => this.emit('processExit', code));

		this.once('ready', this.onReady.bind(this));

		void this.parseStdout(this.process.stdout);
	}

	private async handleBridgeMessage({ method, id, params }: jsonrpc.RequestObject): Promise<jsonrpc.SuccessObject | jsonrpc.ErrorObject> {
		const [bridgeName, bridgeMethod] = method.substring(8).split(':');

		this.debug('Handling bridge message %s().%s() with params %s', bridgeName, bridgeMethod, inspect(params));

		if (!bridgeMethod.startsWith('do') || !Array.isArray(params)) {
			throw new Error('Invalid bridge request');
		}

		let bridgeInstance: unknown;

		// The internal AppResourceBridge is not part of the app-facing `AppBridges` surface; it is
		// resolved through its own reference. Registration methods are suppressed while the process
		// is restarting so that re-running `app:initialize` does not re-register host resources.
		if (bridgeName === 'getAppResourceBridge') {
			if (this.state === 'restarting' && AppResourceBridge.REGISTRATION_METHODS.has(bridgeMethod)) {
				return jsonrpc.success(id, null);
			}

			bridgeInstance = this.appResourceBridge;
		} else {
			const bridge = this.bridges[bridgeName as keyof typeof this.bridges];

			if (typeof bridge !== 'function') {
				throw new Error('Invalid bridge request');
			}

			bridgeInstance = bridge.call(this.bridges);
		}

		const methodRef = (bridgeInstance as Record<string, unknown>)[bridgeMethod] as unknown;

		if (typeof methodRef !== 'function') {
			throw new Error('Invalid bridge request');
		}

		let result;
		try {
			result = await methodRef.apply(
				bridgeInstance,
				// Should the protocol expect the placeholder APP_ID value or should the Deno process send the actual appId?
				// If we do not expect the APP_ID, the Deno process will be able to impersonate other apps, potentially
				params.map((value: unknown) => (value === 'APP_ID' ? this.appPackage.info.id : value)),
			);
		} catch (error) {
			this.debug('Error executing bridge method %s().%s() %s', bridgeName, bridgeMethod, inspect(error.message));
			const jsonRpcError = new jsonrpc.JsonRpcError(error.message, -32000, error);
			return jsonrpc.error(id, jsonRpcError);
		}

		return jsonrpc.success(id, typeof result === 'undefined' ? null : result);
	}

	private async handleIncomingMessage(message: jsonrpc.NotificationObject | jsonrpc.RequestObject): Promise<void> {
		const { method } = message;

		if (method.startsWith('bridges:')) {
			let result: jsonrpc.SuccessObject | jsonrpc.ErrorObject;

			try {
				result = await this.handleBridgeMessage(message as jsonrpc.RequestObject);
			} catch (e) {
				result = jsonrpc.error((message as jsonrpc.RequestObject).id, new jsonrpc.JsonRpcError(e.message, 1000));
			}

			this.messenger.send(result);

			return;
		}

		switch (method) {
			case 'ready':
				this.emit('ready');
				break;
			case 'log':
				console.log('SUBPROCESS LOG', message);
				break;
			case 'unhandledRejection':
			case 'uncaughtException':
				await this.logUnhandledError(`runtime:${method}`, message);
				break;
			default:
				console.warn('Unrecognized method from sub process');
				break;
		}
	}

	private async logUnhandledError(
		method: `${AppMethod.RUNTIME_UNCAUGHT_EXCEPTION | AppMethod.RUNTIME_UNHANDLED_REJECTION}`,
		message: jsonrpc.RequestObject | jsonrpc.NotificationObject,
	) {
		this.debug('Unhandled error of type "%s" caught in subprocess', method);

		const logger = new AppConsole(method);
		logger.error(message);

		await this.logStorage.storeEntries(AppConsole.toStorageEntry(this.getAppId(), logger));
	}

	private async handleResultMessage(message: jsonrpc.ErrorObject | jsonrpc.SuccessObject): Promise<void> {
		const { id } = message;

		let result: unknown;
		let error: jsonrpc.JsonRpcError | undefined;
		let logs: ILoggerStorageEntry;

		if (message instanceof jsonrpc.SuccessObject) {
			const params = message.result as { value: unknown; logs?: ILoggerStorageEntry };
			result = params.value;
			logs = params.logs;
		} else {
			error = message.error;
			logs = message.error.data?.logs as ILoggerStorageEntry;
		}

		// Should we try to make sure all result messages have logs?
		if (logs) {
			await this.logStorage.storeEntries(logs);
		}

		this.emit(`result:${id}`, result, error);
	}

	private async parseStdout(stream: Readable): Promise<void> {
		try {
			for await (const message of newDecoder().decodeStream(stream)) {
				this.debug('Received message from subprocess %s', inspect(message));
				try {
					// Process PONG resonse first as it is not JSON RPC
					if (message === COMMAND_PONG) {
						this.emit('pong');
						continue;
					}

					this.emit('heartbeat');

					// The codec's JSON-RPC extension rebuilds the envelope classes on decode,
					// so we dispatch straight off the decoded instance - no parse step.
					if (message instanceof jsonrpc.RequestObject || message instanceof jsonrpc.NotificationObject) {
						this.handleIncomingMessage(message).catch((reason) =>
							console.error(`[${this.getAppId()}] Error executing handler`, reason, message),
						);
						continue;
					}

					if (message instanceof jsonrpc.SuccessObject || message instanceof jsonrpc.ErrorObject) {
						this.handleResultMessage(message).catch((reason) =>
							console.error(`[${this.getAppId()}] Error executing handler`, reason, message),
						);
						continue;
					}

					console.error('Unrecognized message type', message);
				} catch (e) {
					console.error(`[${this.getAppId()}] Error executing handler`, e, message);
				}
			}
		} catch (e) {
			console.error(`[${this.getAppId()}]`, e);
			this.emit('error', new Error('DECODE_ERROR'));
		}
	}

	private async parseError(chunk: Buffer): Promise<void> {
		try {
			const data = JSON.parse(chunk.toString());

			this.debug('Metrics received from subprocess (via stderr): %s', inspect(data));
		} catch {
			console.error('Subprocess stderr', chunk.toString());
		}
	}
}
