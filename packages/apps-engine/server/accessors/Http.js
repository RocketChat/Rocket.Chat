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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Http = void 0;
const accessors_1 = require("../../definition/accessors");
class Http {
    constructor(accessManager, bridges, httpExtender, appId) {
        this.accessManager = accessManager;
        this.bridges = bridges;
        this.httpExtender = httpExtender;
        this.appId = appId;
    }
    get(url, options) {
        return this._processHandler(url, accessors_1.RequestMethod.GET, options);
    }
    put(url, options) {
        return this._processHandler(url, accessors_1.RequestMethod.PUT, options);
    }
    post(url, options) {
        return this._processHandler(url, accessors_1.RequestMethod.POST, options);
    }
    del(url, options) {
        return this._processHandler(url, accessors_1.RequestMethod.DELETE, options);
    }
    patch(url, options) {
        return this._processHandler(url, accessors_1.RequestMethod.PATCH, options);
    }
    _processHandler(url, method, options) {
        return __awaiter(this, void 0, void 0, function* () {
            let request = options || {};
            if (typeof request.headers === 'undefined') {
                request.headers = {};
            }
            this.httpExtender.getDefaultHeaders().forEach((value, key) => {
                if (typeof request.headers[key] !== 'string') {
                    request.headers[key] = value;
                }
            });
            if (typeof request.params === 'undefined') {
                request.params = {};
            }
            this.httpExtender.getDefaultParams().forEach((value, key) => {
                if (typeof request.params[key] !== 'string') {
                    request.params[key] = value;
                }
            });
            const reader = this.accessManager.getReader(this.appId);
            const persis = this.accessManager.getPersistence(this.appId);
            for (const handler of this.httpExtender.getPreRequestHandlers()) {
                request = yield handler.executePreHttpRequest(url, request, reader, persis);
            }
            let response = yield this.bridges.getHttpBridge().doCall({
                appId: this.appId,
                method,
                url,
                request,
            });
            for (const handler of this.httpExtender.getPreResponseHandlers()) {
                response = yield handler.executePreHttpResponse(response, reader, persis);
            }
            return response;
        });
    }
}
exports.Http = Http;
//# sourceMappingURL=Http.js.map