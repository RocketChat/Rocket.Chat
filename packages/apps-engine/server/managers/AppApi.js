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
exports.AppApi = void 0;
const api_1 = require("../../definition/api");
class AppApi {
    constructor(app, api, endpoint) {
        this.app = app;
        this.api = api;
        this.endpoint = endpoint;
        this.appId = app.getID();
        switch (this.api.visibility) {
            case api_1.ApiVisibility.PUBLIC:
                this.basePath = `/api/apps/public/${app.getID()}`;
                break;
            case api_1.ApiVisibility.PRIVATE:
                this.basePath = `/api/apps/private/${app.getID()}/${app.getStorageItem()._id}`;
                this.hash = app.getStorageItem()._id;
                break;
        }
        this.computedPath = `${this.basePath}/${endpoint.path}`;
        this.implementedMethods = endpoint._availableMethods;
    }
    runExecutor(request, logStorage, accessors) {
        return __awaiter(this, void 0, void 0, function* () {
            const { path } = this.endpoint;
            const { method } = request;
            if (!this.validateVisibility(request)) {
                return {
                    status: 404,
                };
            }
            if (!this.validateSecurity(request)) {
                return {
                    status: 401,
                };
            }
            const endpoint = {
                basePath: this.basePath,
                fullPath: this.computedPath,
                appId: this.appId,
                hash: this.hash,
            };
            try {
                const result = yield this.app.getDenoRuntime().sendRequest({
                    method: `api:${path}:${method}`,
                    params: [request, endpoint],
                });
                return result;
            }
            catch (e) {
                console.error(e);
                throw e;
            }
        });
    }
    validateVisibility(request) {
        if (this.api.visibility === api_1.ApiVisibility.PUBLIC) {
            return true;
        }
        if (this.api.visibility === api_1.ApiVisibility.PRIVATE) {
            return this.app.getStorageItem()._id === request.privateHash;
        }
        return false;
    }
    validateSecurity(request) {
        if (this.api.security === api_1.ApiSecurity.UNSECURE) {
            return true;
        }
        return false;
    }
}
exports.AppApi = AppApi;
//# sourceMappingURL=AppApi.js.map