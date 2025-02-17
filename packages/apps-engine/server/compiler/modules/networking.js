"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.moduleHandlerFactory = void 0;
const _1 = require(".");
const PermissionDeniedError_1 = require("../../errors/PermissionDeniedError");
const AppPermissionManager_1 = require("../../managers/AppPermissionManager");
const AppPermissions_1 = require("../../permissions/AppPermissions");
const networkingModuleBlockList = ['createServer', 'Server'];
const moduleHandlerFactory = (module) => {
    return (appId) => ({
        get(target, prop, receiver) {
            if (networkingModuleBlockList.includes(prop)) {
                throw new _1.ForbiddenNativeModuleAccess(module, prop);
            }
            if (!AppPermissionManager_1.AppPermissionManager.hasPermission(appId, AppPermissions_1.AppPermissions.networking.default)) {
                throw new PermissionDeniedError_1.PermissionDeniedError({
                    appId,
                    missingPermissions: [AppPermissions_1.AppPermissions.networking.default],
                    methodName: `${module}.${prop}`,
                });
            }
            return Reflect.get(target, prop, receiver);
        },
    });
};
exports.moduleHandlerFactory = moduleHandlerFactory;
//# sourceMappingURL=networking.js.map