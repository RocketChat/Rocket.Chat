"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudWorkspaceBridge = void 0;
const BaseBridge_1 = require("./BaseBridge");
const PermissionDeniedError_1 = require("../errors/PermissionDeniedError");
const AppPermissionManager_1 = require("../managers/AppPermissionManager");
const AppPermissions_1 = require("../permissions/AppPermissions");
class CloudWorkspaceBridge extends BaseBridge_1.BaseBridge {
    doGetWorkspaceToken(scope, appId) {
        if (this.hasCloudTokenPermission(appId)) {
            return this.getWorkspaceToken(scope, appId);
        }
    }
    hasCloudTokenPermission(appId) {
        if (AppPermissionManager_1.AppPermissionManager.hasPermission(appId, AppPermissions_1.AppPermissions.cloud['workspace-token'])) {
            return true;
        }
        AppPermissionManager_1.AppPermissionManager.notifyAboutError(new PermissionDeniedError_1.PermissionDeniedError({
            appId,
            missingPermissions: [AppPermissions_1.AppPermissions.cloud['workspace-token']],
        }));
        return false;
    }
}
exports.CloudWorkspaceBridge = CloudWorkspaceBridge;
//# sourceMappingURL=CloudWorkspaceBridge.js.map