"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppAccessors = void 0;
class AppAccessors {
    constructor(manager, appId) {
        this.appId = appId;
        this.accessorManager = manager.getAccessorManager();
        this.apiManager = manager.getApiManager();
    }
    get environmentReader() {
        return this.accessorManager.getEnvironmentRead(this.appId);
    }
    get environmentWriter() {
        return this.accessorManager.getEnvironmentWrite(this.appId);
    }
    get reader() {
        return this.accessorManager.getReader(this.appId);
    }
    get http() {
        return this.accessorManager.getHttp(this.appId);
    }
    get providedApiEndpoints() {
        return this.apiManager.listApis(this.appId);
    }
}
exports.AppAccessors = AppAccessors;
//# sourceMappingURL=AppAccessors.js.map