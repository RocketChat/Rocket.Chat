import { EventEmitter } from 'node:events';
import { inspect as utilInspect } from 'node:util';

import { AppStatus, AppStatusUtils } from '@rocket.chat/apps-engine/definition/AppStatus';
import type { AppMethod } from '@rocket.chat/apps-engine/definition/metadata';
import debugFactory from 'debug';
import * as jsonrpc from 'jsonrpc-lite';

import { AppsEngineWattRuntime } from './AppsEngineWattRuntime';
import type { AppManager } from '../../AppManager';
import { sanitizeForIpc } from '../../../lib/IpcSanitizer';
import type { IParseAppPackageResult } from '../../compiler';
import { AppConsole, type ILoggerStorageEntry } from '../../logging';
import type { AppLogStorage, IAppStorageItem } from '../../storage';
import { AppRequestRouter } from '../base/AppRequestRouter';
import { bundleLegacyApp } from '../base/bundler';
import type { IRuntimeController, RuntimeRequestOptions } from '../IRuntimeController';

const inspect = (value: unknown) => utilInspect(value, { depth: 10, compact: true, breakLength: Infinity });

const COMMAND_PONG = '_zPONG';

type AbortFunction = (reason?: any) => void;

function getRuntimeTimeout(): number {
	const defaultTimeout = 30000;
	const envValue = isFinite(process.env.APPS_ENGINE_RUNTIME_TIMEOUT as any)
		? Number(process.env.APPS_ENGINE_RUNTIME_TIMEOUT)
		: defaultTimeout;

	if (envValue < 0) {
		return defaultTimeout;
	}

	return envValue;
}

/**
 * Per-app controller for the Watt runtime.
 *
 * It speaks the exact same JSON-RPC protocol as the subprocess controller, but
 * instead of owning a `child_process` and a {@link LivenessManager}, it delegates
 * the transport and the whole worker lifecycle (spawn, restart, liveness,
 * metrics) to the shared {@link AppsEngineWattRuntime}. The controller only owns
 * the protocol state machine and the host-side request routing.
 */
export class WattRuntimeController extends EventEmitter implements IRuntimeController {
	private state: 'uninitialized' | 'ready' | 'invalid' | 'restarting' | 'unknown' | 'stopped';

	private readonly debug: debug.Debugger;

	private readonly options = {
		timeout: getRuntimeTimeout(),
	};

	private readonly wattRuntime: AppsEngineWattRuntime;

	private readonly router: AppRequestRouter;

	private readonly logStorage: AppLogStorage;

	constructor(
		manager: AppManager,
		// Kept around so the app can be reconstructed when its worker is restarted
		private readonly appPackage: IParseAppPackageResult,
		private readonly storageItem: IAppStorageItem,
	) {
		super();

		this.debug = debugFactory('appsEngine:runtime:watt').extend(appPackage.info.id);
		this.state = 'uninitialized';
		this.logStorage = manager.getLogStorage();
		this.wattRuntime = AppsEngineWattRuntime.getInstance(manager);

		this.router = new AppRequestRouter({
			appId: appPackage.info.id,
			accessors: manager.getAccessorManager(),
			api: manager.getApiManager(),
			bridges: manager.getBridges(),
			debug: this.debug,
			getState: () => this.state,
		});

		this.once('ready', () => {
			this.state = 'ready';
		});
	}

	public getAppId(): string {
		return this.appPackage.info.id;
	}

	public getProcessState(): string {
		return this.state;
	}

	public isStopping(): boolean {
		return this.state === 'stopped' || this.state === 'restarting';
	}

	public async getStatus(): Promise<AppStatus> {
		if (this.state === 'stopped' || this.state === 'invalid') {
			return AppStatus.UNKNOWN;
		}

		return this.sendRequest({ method: 'app:getStatus', params: [] }) as Promise<AppStatus>;
	}

	public async setupApp(): Promise<void> {
		this.debug('Setting up app on Watt runtime');

		await this.wattRuntime.registerApp(this);

		// If there is more than one file in the package, then it is a legacy app that has not been bundled
		if (Object.keys(this.appPackage.files).length > 1) {
			await bundleLegacyApp(this.appPackage);
		}

		await this.waitUntilReady();

		await this.sendRequest({ method: 'app:construct', params: [this.appPackage] });

		this.emit('constructed');
	}

	public async stopApp(): Promise<void> {
		this.debug('Stopping app on Watt runtime');

		this.state = 'stopped';

		await this.wattRuntime.unregisterApp(this.getAppId());
	}

	/**
	 * Restarts the app. The worker lifecycle is handled by Watt; here we only
	 * re-run the construction/initialization handshake once the fresh worker is
	 * ready.
	 */
	public async restartApp(): Promise<void> {
		this.debug('Restarting app on Watt runtime');
		const logger = new AppConsole('runtime:watt:restart');

		logger.info({ msg: 'Starting restart procedure for app worker...' });

		this.state = 'restarting';

		try {
			await this.wattRuntime.restartApp(this.getAppId());

			await this.waitUntilReady();

			await this.sendRequest({ method: 'app:construct', params: [this.appPackage] });

			// setupApp() and construct leave the app ready to receive resource
			// registrations again; keep hijacking ConfigurationExtend until we're done
			this.state = 'restarting';

			await this.sendRequest({ method: 'app:initialize' });
			await this.sendRequest({ method: 'app:setStatus', params: [this.storageItem.status] });

			if (AppStatusUtils.isEnabled(this.storageItem.status)) {
				await this.sendRequest({ method: 'app:onEnable' });
			}

			this.state = 'ready';

			logger.info('Successfully restarted app worker');
		} catch (e) {
			logger.error({ msg: "Failed to restart app's worker", err: e });
			throw e;
		} finally {
			await this.logStorage.storeEntries(AppConsole.toStorageEntry(this.getAppId(), logger));
		}
	}

	public async sendRequest(
		message: Pick<jsonrpc.RequestObject, 'method' | 'params'>,
		options: RuntimeRequestOptions = this.options,
	): Promise<unknown> {
		const id = String(Math.random().toString(36)).substring(2);
		const start = Date.now();

		const request = jsonrpc.request(id, message.method, message.params);

		const { promise, abort } = this.waitForResponse(request, options);

		try {
			this.debug('Sending message to Watt worker %s', inspect(message));
			await this.send(request);
		} catch (e) {
			abort(e);
		}

		return promise.finally(() => {
			this.debug('Request %s for method %s took %dms', id, message.method, Date.now() - start);
		});
	}

	private async send(message: jsonrpc.JsonRpc | typeof COMMAND_PONG): Promise<void> {
		// The Watt ITC channel serializes with V8 structured clone, just like the
		// subprocess IPC channel, so the same sanitizer applies.
		await this.wattRuntime.sendToApp(this.getAppId(), sanitizeForIpc(message));
	}

	private waitUntilReady(): Promise<void> {
		if (this.state === 'ready') {
			return Promise.resolve();
		}

		return new Promise((resolve, reject) => {
			let timeoutId: NodeJS.Timeout;

			const handler = () => {
				clearTimeout(timeoutId);
				resolve();
			};

			timeoutId = setTimeout(() => {
				this.off('ready', handler);
				reject(new Error(`[${this.getAppId()}] Timeout: app worker not ready`));
			}, this.options.timeout);

			this.once('ready', handler);
		});
	}

	private waitForResponse(req: jsonrpc.RequestObject, options: RuntimeRequestOptions): { abort: AbortFunction; promise: Promise<unknown> } {
		const controller = new AbortController();
		const { abort, signal } = controller;

		return {
			abort: abort.bind(controller),
			promise: new Promise((resolve, reject) => {
				const eventName = `result:${req.id}`;

				const responseCallback = (result: unknown, error: jsonrpc.IParsedObjectError['payload']['error'] | Error) => {
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

	/**
	 * Entry point for messages coming from the app's worker, routed here by the
	 * shared {@link AppsEngineWattRuntime}.
	 */
	public handleRuntimeMessage(message: unknown): void {
		this.debug('Received message from Watt worker %s', inspect(message));

		try {
			if (message === COMMAND_PONG) {
				this.emit('pong');
				return;
			}

			const JSONRPCMessage = jsonrpc.parseObject(message as Record<string, unknown>);

			if (Array.isArray(JSONRPCMessage)) {
				throw new Error('Invalid message format');
			}

			this.emit('heartbeat');

			if (JSONRPCMessage.type === 'request' || JSONRPCMessage.type === 'notification') {
				this.handleIncomingMessage(JSONRPCMessage).catch((reason) =>
					console.error(`[${this.getAppId()}] Error executing handler`, reason, message),
				);
				return;
			}

			if (JSONRPCMessage.type === 'success' || JSONRPCMessage.type === 'error') {
				this.handleResultMessage(JSONRPCMessage).catch((reason) =>
					console.error(`[${this.getAppId()}] Error executing handler`, reason, message),
				);
				return;
			}

			console.error('Unrecognized message type', JSONRPCMessage);
		} catch (e) {
			console.error(`[${this.getAppId()}] Error executing handler`, e, message);
		}
	}

	private async handleIncomingMessage(message: jsonrpc.IParsedObjectNotification | jsonrpc.IParsedObjectRequest): Promise<void> {
		const { method } = message.payload;

		if (method.startsWith('accessor:') || method.startsWith('bridges:')) {
			const result = await this.router.route(message as jsonrpc.IParsedObjectRequest);

			await this.send(result);

			return;
		}

		switch (method) {
			case 'ready':
				this.emit('ready');
				break;
			case 'metrics':
				this.debug('Metrics received from worker: %s', inspect(message.payload.params));
				break;
			case 'log':
				console.log('WATT WORKER LOG', message);
				break;
			case 'unhandledRejection':
			case 'uncaughtException':
				await this.logUnhandledError(`runtime:${method}`, message);
				break;
			default:
				console.warn('Unrecognized method from Watt worker');
				break;
		}
	}

	private async logUnhandledError(
		method: `${AppMethod.RUNTIME_UNCAUGHT_EXCEPTION | AppMethod.RUNTIME_UNHANDLED_REJECTION}`,
		message: jsonrpc.IParsedObjectRequest | jsonrpc.IParsedObjectNotification,
	): Promise<void> {
		this.debug('Unhandled error of type "%s" caught in worker', method);

		const logger = new AppConsole(method);
		logger.error(message.payload);

		await this.logStorage.storeEntries(AppConsole.toStorageEntry(this.getAppId(), logger));
	}

	private async handleResultMessage(message: jsonrpc.IParsedObjectError | jsonrpc.IParsedObjectSuccess): Promise<void> {
		const { id } = message.payload;

		let result: unknown;
		let error: jsonrpc.IParsedObjectError['payload']['error'] | undefined;
		let logs: ILoggerStorageEntry;

		if (message.type === 'success') {
			const params = message.payload.result as { value: unknown; logs?: ILoggerStorageEntry };
			result = params.value;
			logs = params.logs;
		} else {
			error = message.payload.error;
			logs = message.payload.error.data?.logs as ILoggerStorageEntry;
		}

		if (logs) {
			await this.logStorage.storeEntries(logs);
		}

		this.emit(`result:${id}`, result, error);
	}
}
