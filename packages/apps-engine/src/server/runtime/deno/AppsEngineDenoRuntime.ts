import * as child_process from 'child_process';
import * as path from 'path';
import { type Readable, EventEmitter } from 'stream';

import debugFactory from 'debug';
import * as jsonrpc from 'jsonrpc-lite';

import { LivenessManager } from './LivenessManager';
import { ProcessMessenger } from './ProcessMessenger';
import { bundleLegacyApp } from './bundler';
import { newDecoder } from './codec';
import { AppStatus, AppStatusUtils } from '../../../definition/AppStatus';
import type { AppMethod } from '../../../definition/metadata';
import type { AppManager } from '../../AppManager';
import type { AppBridges } from '../../bridges';
import type { IParseAppPackageResult } from '../../compiler';
import { AppConsole, type ILoggerStorageEntry } from '../../logging';
import type { AppAccessorManager, AppApiManager } from '../../managers';
import type { AppLogStorage, IAppStorageItem } from '../../storage';

const baseDebug = debugFactory('appsEngine:runtime:deno');

export const ALLOWED_ACCESSOR_METHODS = [
    'getConfigurationExtend',
    'getEnvironmentRead',
    'getEnvironmentWrite',
    'getConfigurationModify',
    'getReader',
    'getPersistence',
    'getHttp',
    'getModifier',
] as Array<
    keyof Pick<
        AppAccessorManager,
        | 'getConfigurationExtend'
        | 'getEnvironmentRead'
        | 'getEnvironmentWrite'
        | 'getConfigurationModify'
        | 'getReader'
        | 'getPersistence'
        | 'getHttp'
        | 'getModifier'
    >
>;

// Trying to access environment variables in Deno throws an error where in vm2 it simply returned `undefined`
// So here we define the allowed envvars to prevent the process (and the compatibility) from breaking
export const ALLOWED_ENVIRONMENT_VARIABLES = [
    'NODE_EXTRA_CA_CERTS', // Accessed by the `https` node module
];

const COMMAND_PONG = '_zPONG';

export const JSONRPC_METHOD_NOT_FOUND = -32601;

export function getRuntimeTimeout() {
    const defaultTimeout = 30000;
    const envValue = isFinite(process.env.APPS_ENGINE_RUNTIME_TIMEOUT as any) ? Number(process.env.APPS_ENGINE_RUNTIME_TIMEOUT) : defaultTimeout;

    if (envValue < 0) {
        console.log('Environment variable APPS_ENGINE_RUNTIME_TIMEOUT has a negative value, ignoring...');
        return defaultTimeout;
    }

    return envValue;
}

export function isValidOrigin(accessor: string): accessor is (typeof ALLOWED_ACCESSOR_METHODS)[number] {
    return ALLOWED_ACCESSOR_METHODS.includes(accessor as any);
}

export function getDenoWrapperPath(): string {
    try {
        // This path is relative to the compiled version of the Apps-Engine source
        return require.resolve('../../../deno-runtime/main.ts');
    } catch {
        // This path is relative to the original Apps-Engine files
        return require.resolve('../../../../deno-runtime/main.ts');
    }
}

export type DenoRuntimeOptions = {
    timeout: number;
};

export class DenoRuntimeSubprocessController extends EventEmitter {
    private deno: child_process.ChildProcess | undefined;

    private state: 'uninitialized' | 'ready' | 'invalid' | 'restarting' | 'unknown' | 'stopped';

    /**
     * Incremental id that keeps track of how many times we've spawned a process for this app
     */
    private spawnId = 0;

    private readonly debug: debug.Debugger;

    private readonly options = {
        timeout: getRuntimeTimeout(),
    };

    private readonly accessors: AppAccessorManager;

    private readonly api: AppApiManager;

    private readonly logStorage: AppLogStorage;

    private readonly bridges: AppBridges;

    private readonly messenger: ProcessMessenger;

    private readonly livenessManager: LivenessManager;

    // We need to keep the appSource around in case the Deno process needs to be restarted
    constructor(
        manager: AppManager,
        private readonly appPackage: IParseAppPackageResult,
        private readonly storageItem: IAppStorageItem,
    ) {
        super();

        this.debug = baseDebug.extend(appPackage.info.id);
        this.messenger = new ProcessMessenger(this.debug);
        this.livenessManager = new LivenessManager({
            controller: this,
            messenger: this.messenger,
            debug: this.debug,
        });

        this.state = 'uninitialized';

        this.accessors = manager.getAccessorManager();
        this.api = manager.getApiManager();
        this.logStorage = manager.getLogStorage();
        this.bridges = manager.getBridges();
    }

    public spawnProcess(): void {
        try {
            const denoExePath = 'deno';

            const denoWrapperPath = getDenoWrapperPath();
            // During development, the appsEngineDir is enough to run the deno process
            const appsEngineDir = path.dirname(path.join(denoWrapperPath, '..'));
            const DENO_DIR = process.env.DENO_DIR ?? path.join(appsEngineDir, '.deno-cache');
            // When running in production, we're likely inside a node_modules which the Deno
            // process must be able to read in order to include files that use NPM packages
            const parentNodeModulesDir = path.dirname(path.join(appsEngineDir, '..'));

            const options = [
                'run',
                `--allow-read=${appsEngineDir},${parentNodeModulesDir}`,
                `--allow-env=${ALLOWED_ENVIRONMENT_VARIABLES.join(',')}`,
                denoWrapperPath,
                '--subprocess',
                this.appPackage.info.id,
                '--spawnId',
                String(this.spawnId++),
            ];

            // If the app doesn't request any permissions, it gets the default set of permissions, which includes "networking"
            // If the app requests specific permissions, we need to check whether it requests "networking" or not
            if (!this.appPackage.info.permissions || this.appPackage.info.permissions.findIndex((p) => p.name === 'networking') !== -1) {
                options.splice(1, 0, '--allow-net');
            }

            const environment = {
                env: {
                    // We need to pass the PATH, otherwise the shell won't find the deno executable
                    // But the runtime itself won't have access to the env var because of the parameters
                    PATH: process.env.PATH,
                    DENO_DIR,
                },
            };

            this.deno = child_process.spawn(denoExePath, options, environment);
            this.messenger.setReceiver(this.deno);
            this.livenessManager.attach(this.deno);

            this.debug('Started subprocess %d with options %O and env %O', this.deno.pid, options, environment);

            this.setupListeners();
        } catch (e) {
            this.state = 'invalid';
            console.error(`Failed to start Deno subprocess for app ${this.getAppId()}`, e);
        }
    }

    /**
     * Attempts to kill the process currently controlled by this.deno
     *
     * @returns boolean - if a process has been killed or not
     */
    public async killProcess(): Promise<boolean> {
        if (!this.deno) {
            this.debug('No child process reference');
            return false;
        }

        let { killed } = this.deno;

        // This field is not populated if the process is killed by the OS
        if (killed) {
            this.debug('App process was already killed');
            return killed;
        }

        // What else should we do?
        if (this.deno.kill('SIGKILL')) {
            // Let's wait until we get confirmation the process exited
            await new Promise<void>((r) => this.deno.on('exit', r));
            killed = true;
        } else {
            this.debug('Tried killing the process but failed. Was it already dead?');
            killed = false;
        }

        delete this.deno;
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
        if (!this.deno || this.deno.exitCode !== null) {
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
    }

    public async stopApp() {
        this.debug('Stopping app subprocess');

        this.state = 'stopped';

        await this.killProcess();
    }

    public async restartApp() {
        this.debug('Restarting app subprocess');
        const logger = new AppConsole('runtime:restart');

        logger.info('Starting restart procedure for app subprocess...', this.livenessManager.getRuntimeData());

        this.state = 'restarting';

        try {
            const pid = this.deno?.pid;

            const hasKilled = await this.killProcess();

            if (hasKilled) {
                logger.debug('Process successfully terminated', { pid });
            } else {
                logger.warn('Could not terminate process. Maybe it was already dead?', { pid });
            }

            await this.setupApp();
            logger.info('New subprocess successfully spawned', { pid: this.deno.pid });

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
            logger.error("Failed to restart app's subprocess", { error: e.message || e });
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

        const promise = this.waitForResponse(request, options).finally(() => {
            this.debug('Request %s for method %s took %dms', id, message.method, Date.now() - start);
        });

        this.messenger.send(request);

        return promise;
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

    private waitForResponse(req: jsonrpc.RequestObject, options = this.options): Promise<unknown> {
        return new Promise((resolve, reject) => {
            const responseCallback = (result: unknown, error: jsonrpc.IParsedObjectError['payload']['error']) => {
                clearTimeout(timeoutId);

                if (error) {
                    reject(error);
                }

                resolve(result);
            };

            const eventName = `result:${req.id}`;

            const timeoutId = setTimeout(() => {
                this.off(eventName, responseCallback);
                reject(new Error(`[${this.getAppId()}] Request "${req.id}" for method "${req.method}" timed out`));
            }, options.timeout);

            this.once(eventName, responseCallback);
        });
    }

    private onReady(): void {
        this.state = 'ready';
    }

    /**
     * Listeners need to be setup every time the reference
     * in `this.deno` changes, i.e. every time the subprocess
     * is restarted
     */
    private setupListeners(): void {
        if (!this.deno) {
            return;
        }

        this.deno.stderr.on('data', this.parseError.bind(this));
        this.deno.on('error', (err) => {
            this.state = 'invalid';
            console.error(`Failed to startup Deno subprocess for app ${this.getAppId()}`, err);
        });

        this.deno.once('exit', (code) => this.emit('processExit', code));

        this.once('ready', this.onReady.bind(this));

        this.parseStdout(this.deno.stdout);
    }

    // Probable should extract this to a separate file
    private async handleAccessorMessage({ payload: { method, id, params } }: jsonrpc.IParsedObjectRequest): Promise<jsonrpc.SuccessObject> {
        const accessorMethods = method.substring(9).split(':'); // First 9 characters are always 'accessor:'

        this.debug('Handling accessor message %o with params %o', accessorMethods, params);

        const managerOrigin = accessorMethods.shift();
        const tailMethodName = accessorMethods.pop();

        // If we're restarting the app, we can't register resources again, so we
        // hijack requests for the `ConfigurationExtend` accessor and don't let them through
        // This needs to be refactored ASAP
        if (this.state === 'restarting' && managerOrigin === 'getConfigurationExtend') {
            return jsonrpc.success(id, null);
        }

        if (managerOrigin === 'api' && tailMethodName === 'listApis') {
            const result = this.api.listApis(this.appPackage.info.id);

            return jsonrpc.success(id, result);
        }

        /**
         * At this point, the accessorMethods array will contain the path to the accessor from the origin (AppAccessorManager)
         * The accessor is the one that contains the actual method the app wants to call
         *
         * Most of the times, it will take one step from origin to accessor
         * For example, for the call AppAccessorManager.getEnvironmentRead().getServerSettings().getValueById() we'll have
         * the following:
         *
         * ```
         * const managerOrigin = 'getEnvironmentRead'
         * const tailMethod = 'getValueById'
         * const accessorMethods = ['getServerSettings']
         * ```
         *
         * But sometimes there can be more steps, like in the following example:
         * AppAccessorManager.getReader().getEnvironmentReader().getEnvironmentVariables().getValueByName()
         * In this case, we'll have:
         *
         * ```
         * const managerOrigin = 'getReader'
         * const tailMethod = 'getValueByName'
         * const accessorMethods = ['getEnvironmentReader', 'getEnvironmentVariables']
         * ```
         **/
        // Prevent app from trying to get properties from the manager that
        // are not intended for public access
        if (!isValidOrigin(managerOrigin)) {
            throw new Error(`Invalid accessor namespace "${managerOrigin}"`);
        }

        // Need to fix typing of return value
        const getAccessorForOrigin = (
            accessorMethods: string[],
            managerOrigin: (typeof ALLOWED_ACCESSOR_METHODS)[number],
            accessorManager: AppAccessorManager,
        ) => {
            const origin = accessorManager[managerOrigin](this.appPackage.info.id);

            if (managerOrigin === 'getHttp' || managerOrigin === 'getPersistence') {
                return origin;
            }

            if (managerOrigin === 'getConfigurationExtend' || managerOrigin === 'getConfigurationModify') {
                return origin[accessorMethods[0] as keyof typeof origin];
            }

            let accessor = origin;

            // Call all intermediary objects to "resolve" the accessor
            accessorMethods.forEach((methodName) => {
                const method = accessor[methodName as keyof typeof accessor] as unknown;

                if (typeof method !== 'function') {
                    throw new Error(`Invalid accessor method "${methodName}"`);
                }

                accessor = method.apply(accessor);
            });

            return accessor;
        };

        const accessor = getAccessorForOrigin(accessorMethods, managerOrigin, this.accessors);

        const tailMethod = accessor[tailMethodName as keyof typeof accessor] as unknown;

        if (typeof tailMethod !== 'function') {
            throw new Error(`Invalid accessor method "${tailMethodName}"`);
        }

        const result = await tailMethod.apply(accessor, params);

        return jsonrpc.success(id, typeof result === 'undefined' ? null : result);
    }

    private async handleBridgeMessage({ payload: { method, id, params } }: jsonrpc.IParsedObjectRequest): Promise<jsonrpc.SuccessObject | jsonrpc.ErrorObject> {
        const [bridgeName, bridgeMethod] = method.substring(8).split(':');

        this.debug('Handling bridge message %s().%s() with params %o', bridgeName, bridgeMethod, params);

        const bridge = this.bridges[bridgeName as keyof typeof this.bridges];

        if (!bridgeMethod.startsWith('do') || typeof bridge !== 'function' || !Array.isArray(params)) {
            throw new Error('Invalid bridge request');
        }

        const bridgeInstance = bridge.call(this.bridges);

        const methodRef = bridgeInstance[bridgeMethod as keyof typeof bridge] as unknown;

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
            this.debug('Error executing bridge method %s().%s() %o', bridgeName, bridgeMethod, error.message);
            const jsonRpcError = new jsonrpc.JsonRpcError(error.message, -32000, error);
            return jsonrpc.error(id, jsonRpcError);
        }

        return jsonrpc.success(id, typeof result === 'undefined' ? null : result);
    }

    private async handleIncomingMessage(message: jsonrpc.IParsedObjectNotification | jsonrpc.IParsedObjectRequest): Promise<void> {
        const { method } = message.payload;

        if (method.startsWith('accessor:')) {
            let result: jsonrpc.SuccessObject | jsonrpc.ErrorObject;

            try {
                result = await this.handleAccessorMessage(message as jsonrpc.IParsedObjectRequest);
            } catch (e) {
                result = jsonrpc.error((message.payload as jsonrpc.RequestObject).id, new jsonrpc.JsonRpcError(e.message, 1000));
            }

            this.messenger.send(result);

            return;
        }

        if (method.startsWith('bridges:')) {
            let result: jsonrpc.SuccessObject | jsonrpc.ErrorObject;

            try {
                result = await this.handleBridgeMessage(message as jsonrpc.IParsedObjectRequest);
            } catch (e) {
                result = jsonrpc.error((message.payload as jsonrpc.RequestObject).id, new jsonrpc.JsonRpcError(e.message, 1000));
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
        message: jsonrpc.IParsedObjectRequest | jsonrpc.IParsedObjectNotification,
    ) {
        this.debug('Unhandled error of type "%s" caught in subprocess', method);

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

        // Should we try to make sure all result messages have logs?
        if (logs) {
            await this.logStorage.storeEntries(logs);
        }

        this.emit(`result:${id}`, result, error);
    }

    private async parseStdout(stream: Readable): Promise<void> {
        try {
            for await (const message of newDecoder().decodeStream(stream)) {
                this.debug('Received message from subprocess %o', message);
                try {
                    // Process PONG resonse first as it is not JSON RPC
                    if (message === COMMAND_PONG) {
                        this.emit('pong');
                        continue;
                    }

                    const JSONRPCMessage = jsonrpc.parseObject(message);

                    if (Array.isArray(JSONRPCMessage)) {
                        throw new Error('Invalid message format');
                    }

                    if (JSONRPCMessage.type === 'request' || JSONRPCMessage.type === 'notification') {
                        this.handleIncomingMessage(JSONRPCMessage).catch((reason) =>
                            console.error(`[${this.getAppId()}] Error executing handler`, reason, message),
                        );
                        continue;
                    }

                    if (JSONRPCMessage.type === 'success' || JSONRPCMessage.type === 'error') {
                        this.handleResultMessage(JSONRPCMessage).catch((reason) =>
                            console.error(`[${this.getAppId()}] Error executing handler`, reason, message),
                        );
                        continue;
                    }

                    console.error('Unrecognized message type', JSONRPCMessage);
                } catch (e) {
                    // SyntaxError is thrown when the message is not a valid JSON
                    if (e instanceof SyntaxError) {
                        console.error(`[${this.getAppId()}] Failed to parse message`);
                        continue;
                    }

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

            this.debug('Metrics received from subprocess (via stderr): %o', data);
        } catch (e) {
            console.error('Subprocess stderr', chunk.toString());
        }
    }
}
