"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiExtend = void 0;
class ApiExtend {
    constructor(manager, appId) {
        this.manager = manager;
        this.appId = appId;
    }
    provideApi(api) {
        return Promise.resolve(this.manager.addApi(this.appId, api));
    }
}
exports.ApiExtend = ApiExtend;
//# sourceMappingURL=ApiExtend.js.map