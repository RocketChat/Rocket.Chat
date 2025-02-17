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
exports.AppApiManager = void 0;
const AppStatus_1 = require("../../definition/AppStatus");
const accessors_1 = require("../../definition/accessors");
const errors_1 = require("../errors");
const AppApi_1 = require("./AppApi");
/**
 * The api manager for the Apps.
 *
 * An App will add api's during their `initialize` method.
 * Then once an App's `onEnable` is called and it returns true,
 * only then will that App's api's be enabled.
 */
class AppApiManager {
    constructor(manager) {
        this.manager = manager;
        this.bridge = this.manager.getBridges().getApiBridge();
        this.accessors = this.manager.getAccessorManager();
        this.providedApis = new Map();
    }
    /**
     * Adds an to *be* registered. This will *not register* it with the
     * bridged system yet as this is only called on an App's
     * `initialize` method and an App might not get enabled.
     * When adding an api, it can *not* already exist in the system.
     *
     * @param appId the app's id which the api belongs to
     * @param api the api to add to the system
     */
    addApi(appId, api) {
        if (api.endpoints.length === 0) {
            throw new Error('Invalid Api parameter provided, endpoints must contain, at least, one IApiEndpoint.');
        }
        const app = this.manager.getOneById(appId);
        if (!app) {
            throw new Error('App must exist in order for an api to be added.');
        }
        // Verify the api's path doesn't exist already
        if (this.providedApis.get(appId)) {
            api.endpoints.forEach((endpoint) => {
                if (this.providedApis.get(appId).has(endpoint.path)) {
                    throw new errors_1.PathAlreadyExistsError(endpoint.path);
                }
            });
        }
        if (!this.providedApis.has(appId)) {
            this.providedApis.set(appId, new Map());
        }
        api.endpoints.forEach((endpoint) => {
            this.providedApis.get(appId).set(endpoint.path, new AppApi_1.AppApi(app, api, endpoint));
        });
    }
    /**
     * Registers all of the api's for the provided app inside
     * of the bridged system which then enables them.
     *
     * @param appId The app's id of which to register it's api's with the bridged system
     */
    registerApis(appId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, e_1, _b, _c;
            if (!this.providedApis.has(appId)) {
                return;
            }
            yield this.bridge.doUnregisterApis(appId);
            try {
                for (var _d = true, _e = __asyncValues(this.providedApis.get(appId).entries()), _f; _f = yield _e.next(), _a = _f.done, !_a; _d = true) {
                    _c = _f.value;
                    _d = false;
                    const [, apiApp] = _c;
                    yield this.registerApi(appId, apiApp);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (!_d && !_a && (_b = _e.return)) yield _b.call(_e);
                }
                finally { if (e_1) throw e_1.error; }
            }
        });
    }
    /**
     * Unregisters the api's from the system.
     *
     * @param appId the appId for the api's to purge
     */
    unregisterApis(appId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.providedApis.has(appId)) {
                yield this.bridge.doUnregisterApis(appId);
                this.providedApis.delete(appId);
            }
        });
    }
    /**
     * Executes an App's api.
     *
     * @param appId the app which is providing the api
     * @param path the path to be executed in app's api's
     * @param request the request data to be evaluated byt the app
     */
    executeApi(appId, path, request) {
        return __awaiter(this, void 0, void 0, function* () {
            const api = this.providedApis.get(appId).get(path);
            if (!api) {
                return {
                    status: accessors_1.HttpStatusCode.NOT_FOUND,
                };
            }
            const app = this.manager.getOneById(appId);
            if (!app || AppStatus_1.AppStatusUtils.isDisabled(yield app.getStatus())) {
                // Just in case someone decides to do something they shouldn't
                // let's ensure the app actually exists
                return {
                    status: accessors_1.HttpStatusCode.NOT_FOUND,
                };
            }
            return api.runExecutor(request, this.manager.getLogStorage(), this.accessors);
        });
    }
    /**
     * Return a list of api's for a certain app
     *
     * @param appId the app which is providing the api
     */
    listApis(appId) {
        const apis = this.providedApis.get(appId);
        if (!apis) {
            return [];
        }
        const result = [];
        for (const api of apis.values()) {
            const metadata = {
                path: api.endpoint.path,
                computedPath: api.computedPath,
                methods: api.implementedMethods,
                examples: api.endpoint.examples || {},
            };
            result.push(metadata);
        }
        return result;
    }
    /**
     * Actually goes and provide's the bridged system with the api information.
     *
     * @param appId the app which is providing the api
     * @param info the api's registration information
     */
    registerApi(appId, api) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.bridge.doRegisterApi(api, appId);
        });
    }
}
exports.AppApiManager = AppApiManager;
//# sourceMappingURL=AppApiManager.js.map