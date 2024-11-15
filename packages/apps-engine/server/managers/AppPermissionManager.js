"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppPermissionManager = void 0;
const AppManager_1 = require("../AppManager");
const PermissionDeniedError_1 = require("../errors/PermissionDeniedError");
const AppsEngineRuntime_1 = require("../runtime/AppsEngineRuntime");
class AppPermissionManager {
    /**
     * It returns the declaration of the permission if the app declared, or it returns `undefined`.
     */
    static hasPermission(appId, permission) {
        if (process.env.NODE_ENV === 'test') {
            return permission;
        }
        const grantedPermission = (0, AppManager_1.getPermissionsByAppId)(appId).find(({ name }) => name === permission.name);
        if (!grantedPermission) {
            return undefined;
        }
        return grantedPermission;
    }
    static notifyAboutError(err) {
        if (err instanceof PermissionDeniedError_1.PermissionDeniedError) {
            const { name, message } = err;
            console.error(`${name}: ${message}\n${this.getCallStack()}`);
        }
        else {
            console.error(err);
        }
    }
    static getCallStack() {
        const stack = new Error().stack.toString().split('\n');
        const appStackIndex = stack.findIndex((position) => position.includes(AppsEngineRuntime_1.APPS_ENGINE_RUNTIME_FILE_PREFIX));
        return stack.slice(4, appStackIndex).join('\n');
    }
}
exports.AppPermissionManager = AppPermissionManager;
//# sourceMappingURL=AppPermissionManager.js.map