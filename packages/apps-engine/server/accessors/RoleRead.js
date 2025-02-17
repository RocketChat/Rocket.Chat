"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleRead = void 0;
class RoleRead {
    constructor(roleBridge, appId) {
        this.roleBridge = roleBridge;
        this.appId = appId;
    }
    getOneByIdOrName(idOrName) {
        return this.roleBridge.doGetOneByIdOrName(idOrName, this.appId);
    }
    getCustomRoles() {
        return this.roleBridge.doGetCustomRoles(this.appId);
    }
}
exports.RoleRead = RoleRead;
//# sourceMappingURL=RoleRead.js.map