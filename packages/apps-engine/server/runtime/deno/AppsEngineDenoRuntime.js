"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DenoRuntimeSubprocessController = exports.JSONRPC_METHOD_NOT_FOUND = exports.ALLOWED_ENVIRONMENT_VARIABLES = exports.ALLOWED_ACCESSOR_METHODS = void 0;
exports.getRuntimeTimeout = getRuntimeTimeout;
exports.isValidOrigin = isValidOrigin;
exports.getDenoWrapperPath = getDenoWrapperPath;
const child_process = require("child_process");
const path = require("path");
const stream_1 = require("stream");
const debug_1 = require("debug");
const jsonrpc = require("jsonrpc-lite");
const LivenessManager_1 = require("./LivenessManager");
const ProcessMessenger_1 = require("./ProcessMessenger");
const bundler_1 = require("./bundler");
const codec_1 = require("./codec");
const AppStatus_1 = require("../../../definition/AppStatus");
const logging_1 = require("../../logging");
const baseDebug = (0, debug_1.default)('appsEngine:runtime:deno');
exports.ALLOWED_ACCESSOR_METHODS = [
    'getConfigurationExtend',
    'getEnvironmentRead',
    'getEnvironmentWrite',
    'getConfigurationModify',
    'getReader',
    'getPersistence',
    'getHttp',
    'getModifier',
];
// Trying to access environment variables in Deno throws an error where in vm2 it simply returned `undefined`
// So here we define the allowed envvars to prevent the process (and the compatibility) from breaking
exports.ALLOWED_ENVIRONMENT_VARIABLES = [
    'NODE_EXTRA_CA_CERTS', // Accessed by the `https` node module
];
const COMMAND_PONG = '_zPONG';
exports.JSONRPC_METHOD_NOT_FOUND = -32601;
function getRuntimeTimeout() {
    const defaultTimeout = 30000;
    const envValue = isFinite(process.env.APPS_ENGINE_RUNTIME_TIMEOUT) ? Number(process.env.APPS_ENGINE_RUNTIME_TIMEOUT) : defaultTimeout;
    if (envValue < 0) {
        console.log('Environment variable APPS_ENGINE_RUNTIME_TIMEOUT has a negative value, ignoring...');
        return defaultTimeout;
    }
    return envValue;
}
function isValidOrigin(accessor) {
    return exports.ALLOWED_ACCESSOR_METHODS.includes(accessor);
}
function getDenoWrapperPath() {
    try {
        // This path is relative to the compiled version of the Apps-Engine source
        return require.resolve('../../../deno-runtime/main.ts');
    }
    catch (_a) {
        // This path is relative to the original Apps-Engine files
        return require.resolve('../../../../deno-runtime/main.ts');
    }
}
class DenoRuntimeSubprocessController extends stream_1.EventEmitter {
    // We need to keep the appSource around in case the Deno process needs to be restarted
    constructor(manager, appPackage, storageItem) {
        super();
        this.appPackage = appPackage;
        this.storageItem = storageItem;
        /**
         * Incremental id that keeps track of how many times we've spawned a process for this app
         */
        this.spawnId = 0;
        this.options = {
            timeout: getRuntimeTimeout(),
        };
        this.debug = baseDebug.extend(appPackage.info.id);
        this.messenger = new ProcessMessenger_1.ProcessMessenger(this.debug);
        this.livenessManager = new LivenessManager_1.LivenessManager({
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
    spawnProcess() {
        var _a;
        try {
            const denoExePath = 'deno';
            const denoWrapperPath = getDenoWrapperPath();
            // During development, the appsEngineDir is enough to run the deno process
            const appsEngineDir = path.dirname(path.join(denoWrapperPath, '..'));
            const DENO_DIR = (_a = process.env.DENO_DIR) !== null && _a !== void 0 ? _a : path.join(appsEngineDir, '.deno-cache');
            // When running in production, we're likely inside a node_modules which the Deno
            // process must be able to read in order to include files that use NPM packages
            const parentNodeModulesDir = path.dirname(path.join(appsEngineDir, '..'));
            const options = [
                'run',
                `--allow-read=${appsEngineDir},${parentNodeModulesDir}`,
                `--allow-env=${exports.ALLOWED_ENVIRONMENT_VARIABLES.join(',')}`,
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
        }
        catch (e) {
            this.state = 'invalid';
            console.error(`Failed to start Deno subprocess for app ${this.getAppId()}`, e);
        }
    }
    /**
     * Attempts to kill the process currently controlled by this.deno
     *
     * @returns boolean - if a process has been killed or not
     */
    killProcess() {
        return __awaiter(this, void 0, void 0, function* () {
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
                yield new Promise((r) => this.deno.on('exit', r));
                killed = true;
            }
            else {
                this.debug('Tried killing the process but failed. Was it already dead?');
                killed = false;
            }
            delete this.deno;
            this.messenger.clearReceiver();
            return killed;
        });
    }
    // Debug purposes, could be deleted later
    emit(eventName, ...args) {
        const hadListeners = super.emit(eventName, ...args);
        if (!hadListeners) {
            this.debug('Emitted but no one listened: ', eventName, args);
        }
        return hadListeners;
    }
    getProcessState() {
        return this.state;
    }
    getStatus() {
        return __awaiter(this, void 0, void 0, function* () {
            // If the process has been terminated, we can't get the status
            if (!this.deno || this.deno.exitCode !== null) {
                return AppStatus_1.AppStatus.UNKNOWN;
            }
            return this.sendRequest({ method: 'app:getStatus', params: [] });
        });
    }
    setupApp() {
        return __awaiter(this, void 0, void 0, function* () {
            this.debug('Setting up app subprocess');
            this.spawnProcess();
            // If there is more than one file in the package, then it is a legacy app that has not been bundled
            if (Object.keys(this.appPackage.files).length > 1) {
                yield (0, bundler_1.bundleLegacyApp)(this.appPackage);
            }
            yield this.waitUntilReady();
            yield this.sendRequest({ method: 'app:construct', params: [this.appPackage] });
        });
    }
    stopApp() {
        return __awaiter(this, void 0, void 0, function* () {
            this.debug('Stopping app subprocess');
            this.state = 'stopped';
            yield this.killProcess();
        });
    }
    restartApp() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            this.debug('Restarting app subprocess');
            const logger = new logging_1.AppConsole('runtime:restart');
            logger.info('Starting restart procedure for app subprocess...', this.livenessManager.getRuntimeData());
            this.state = 'restarting';
            try {
                const pid = (_a = this.deno) === null || _a === void 0 ? void 0 : _a.pid;
                const hasKilled = yield this.killProcess();
                if (hasKilled) {
                    logger.debug('Process successfully terminated', { pid });
                }
                else {
                    logger.warn('Could not terminate process. Maybe it was already dead?', { pid });
                }
                yield this.setupApp();
                logger.info('New subprocess successfully spawned', { pid: this.deno.pid });
                // setupApp() changes the state to 'ready' - we'll need to workaround that for now
                this.state = 'restarting';
                yield this.sendRequest({ method: 'app:initialize' });
                yield this.sendRequest({ method: 'app:setStatus', params: [this.storageItem.status] });
                if (AppStatus_1.AppStatusUtils.isEnabled(this.storageItem.status)) {
                    yield this.sendRequest({ method: 'app:onEnable' });
                }
                this.state = 'ready';
                logger.info('Successfully restarted app subprocess');
            }
            catch (e) {
                logger.error("Failed to restart app's subprocess", { error: e.message || e });
                throw e;
            }
            finally {
                yield this.logStorage.storeEntries(logging_1.AppConsole.toStorageEntry(this.getAppId(), logger));
            }
        });
    }
    getAppId() {
        return this.appPackage.info.id;
    }
    sendRequest(message_1) {
        return __awaiter(this, arguments, void 0, function* (message, options = this.options) {
            const id = String(Math.random().toString(36)).substring(2);
            const start = Date.now();
            const request = jsonrpc.request(id, message.method, message.params);
            const promise = this.waitForResponse(request, options).finally(() => {
                this.debug('Request %s for method %s took %dms', id, message.method, Date.now() - start);
            });
            this.messenger.send(request);
            return promise;
        });
    }
    waitUntilReady() {
        if (this.state === 'ready') {
            return;
        }
        return new Promise((resolve, reject) => {
            let timeoutId;
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
    waitForResponse(req, options = this.options) {
        return new Promise((resolve, reject) => {
            const responseCallback = (result, error) => {
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
    onReady() {
        this.state = 'ready';
    }
    setupListeners() {
        if (!this.deno) {
            return;
        }
        this.deno.stderr.on('data', this.parseError.bind(this));
        this.deno.on('error', (err) => {
            this.state = 'invalid';
            console.error(`Failed to startup Deno subprocess for app ${this.getAppId()}`, err);
        });
        this.once('ready', this.onReady.bind(this));
        this.parseStdout(this.deno.stdout);
    }
    // Probable should extract this to a separate file
    handleAccessorMessage(_a) {
        return __awaiter(this, arguments, void 0, function* ({ payload: { method, id, params } }) {
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
            const getAccessorForOrigin = (accessorMethods, managerOrigin, accessorManager) => {
                const origin = accessorManager[managerOrigin](this.appPackage.info.id);
                if (managerOrigin === 'getHttp' || managerOrigin === 'getPersistence') {
                    return origin;
                }
                if (managerOrigin === 'getConfigurationExtend' || managerOrigin === 'getConfigurationModify') {
                    return origin[accessorMethods[0]];
                }
                let accessor = origin;
                // Call all intermediary objects to "resolve" the accessor
                accessorMethods.forEach((methodName) => {
                    const method = accessor[methodName];
                    if (typeof method !== 'function') {
                        throw new Error(`Invalid accessor method "${methodName}"`);
                    }
                    accessor = method.apply(accessor);
                });
                return accessor;
            };
            const accessor = getAccessorForOrigin(accessorMethods, managerOrigin, this.accessors);
            const tailMethod = accessor[tailMethodName];
            if (typeof tailMethod !== 'function') {
                throw new Error(`Invalid accessor method "${tailMethodName}"`);
            }
            const result = yield tailMethod.apply(accessor, params);
            return jsonrpc.success(id, typeof result === 'undefined' ? null : result);
        });
    }
    handleBridgeMessage(_a) {
        return __awaiter(this, arguments, void 0, function* ({ payload: { method, id, params } }) {
            const [bridgeName, bridgeMethod] = method.substring(8).split(':');
            this.debug('Handling bridge message %s().%s() with params %o', bridgeName, bridgeMethod, params);
            const bridge = this.bridges[bridgeName];
            if (!bridgeMethod.startsWith('do') || typeof bridge !== 'function' || !Array.isArray(params)) {
                throw new Error('Invalid bridge request');
            }
            const bridgeInstance = bridge.call(this.bridges);
            const methodRef = bridgeInstance[bridgeMethod];
            if (typeof methodRef !== 'function') {
                throw new Error('Invalid bridge request');
            }
            let result;
            try {
                result = yield methodRef.apply(bridgeInstance, 
                // Should the protocol expect the placeholder APP_ID value or should the Deno process send the actual appId?
                // If we do not expect the APP_ID, the Deno process will be able to impersonate other apps, potentially
                params.map((value) => (value === 'APP_ID' ? this.appPackage.info.id : value)));
            }
            catch (error) {
                this.debug('Error executing bridge method %s().%s() %o', bridgeName, bridgeMethod, error.message);
                const jsonRpcError = new jsonrpc.JsonRpcError(error.message, -32000, error);
                return jsonrpc.error(id, jsonRpcError);
            }
            return jsonrpc.success(id, typeof result === 'undefined' ? null : result);
        });
    }
    handleIncomingMessage(message) {
        return __awaiter(this, void 0, void 0, function* () {
            const { method } = message.payload;
            if (method.startsWith('accessor:')) {
                let result;
                try {
                    result = yield this.handleAccessorMessage(message);
                }
                catch (e) {
                    result = jsonrpc.error(message.payload.id, new jsonrpc.JsonRpcError(e.message, 1000));
                }
                this.messenger.send(result);
                return;
            }
            if (method.startsWith('bridges:')) {
                let result;
                try {
                    result = yield this.handleBridgeMessage(message);
                }
                catch (e) {
                    result = jsonrpc.error(message.payload.id, new jsonrpc.JsonRpcError(e.message, 1000));
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
                    yield this.logUnhandledError(`runtime:${method}`, message);
                    break;
                default:
                    console.warn('Unrecognized method from sub process');
                    break;
            }
        });
    }
    logUnhandledError(method, message) {
        return __awaiter(this, void 0, void 0, function* () {
            this.debug('Unhandled error of type "%s" caught in subprocess', method);
            const logger = new logging_1.AppConsole(method);
            logger.error(message.payload);
            yield this.logStorage.storeEntries(logging_1.AppConsole.toStorageEntry(this.getAppId(), logger));
        });
    }
    handleResultMessage(message) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const { id } = message.payload;
            let result;
            let error;
            let logs;
            if (message.type === 'success') {
                const params = message.payload.result;
                result = params.value;
                logs = params.logs;
            }
            else {
                error = message.payload.error;
                logs = (_a = message.payload.error.data) === null || _a === void 0 ? void 0 : _a.logs;
            }
            // Should we try to make sure all result messages have logs?
            if (logs) {
                yield this.logStorage.storeEntries(logs);
            }
            this.emit(`result:${id}`, result, error);
        });
    }
    parseStdout(stream) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, e_1, _b, _c;
            try {
                try {
                    for (var _d = true, _e = __asyncValues((0, codec_1.newDecoder)().decodeStream(stream)), _f; _f = yield _e.next(), _a = _f.done, !_a; _d = true) {
                        _c = _f.value;
                        _d = false;
                        const message = _c;
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
                                this.handleIncomingMessage(JSONRPCMessage).catch((reason) => console.error(`[${this.getAppId()}] Error executing handler`, reason, message));
                                continue;
                            }
                            if (JSONRPCMessage.type === 'success' || JSONRPCMessage.type === 'error') {
                                this.handleResultMessage(JSONRPCMessage).catch((reason) => console.error(`[${this.getAppId()}] Error executing handler`, reason, message));
                                continue;
                            }
                            console.error('Unrecognized message type', JSONRPCMessage);
                        }
                        catch (e) {
                            // SyntaxError is thrown when the message is not a valid JSON
                            if (e instanceof SyntaxError) {
                                console.error(`[${this.getAppId()}] Failed to parse message`);
                                continue;
                            }
                            console.error(`[${this.getAppId()}] Error executing handler`, e, message);
                        }
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (!_d && !_a && (_b = _e.return)) yield _b.call(_e);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
            }
            catch (e) {
                console.error(`[${this.getAppId()}]`, e);
                this.emit('error', new Error('DECODE_ERROR'));
            }
        });
    }
    parseError(chunk) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = JSON.parse(chunk.toString());
                this.debug('Metrics received from subprocess (via stderr): %o', data);
            }
            catch (e) {
                console.error('Subprocess stderr', chunk.toString());
            }
        });
    }
}
exports.DenoRuntimeSubprocessController = DenoRuntimeSubprocessController;
//# sourceMappingURL=AppsEngineDenoRuntime.js.map