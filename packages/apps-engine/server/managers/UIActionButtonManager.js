"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UIActionButtonManager = void 0;
const AppPermissionManager_1 = require("./AppPermissionManager");
const PermissionDeniedError_1 = require("../errors/PermissionDeniedError");
const AppPermissions_1 = require("../permissions/AppPermissions");
class UIActionButtonManager {
    constructor(manager) {
        this.registeredActionButtons = new Map();
        this.activationBridge = manager.getBridges().getAppActivationBridge();
    }
    registerActionButton(appId, button) {
        if (!this.hasPermission(appId)) {
            return false;
        }
        if (!this.registeredActionButtons.has(appId)) {
            this.registeredActionButtons.set(appId, new Map());
        }
        this.registeredActionButtons.get(appId).set(button.actionId, button);
        this.activationBridge.doActionsChanged();
        return true;
    }
    clearAppActionButtons(appId) {
        this.registeredActionButtons.set(appId, new Map());
        this.activationBridge.doActionsChanged();
    }
    getAppActionButtons(appId) {
        return this.registeredActionButtons.get(appId);
    }
    getAllActionButtons() {
        const buttonList = [];
        // Flatten map to a simple list of all buttons
        this.registeredActionButtons.forEach((appButtons, appId) => appButtons.forEach((button) => buttonList.push(Object.assign(Object.assign({}, button), { appId }))));
        return buttonList;
    }
    hasPermission(appId) {
        if (AppPermissionManager_1.AppPermissionManager.hasPermission(appId, AppPermissions_1.AppPermissions.ui.registerButtons)) {
            return true;
        }
        AppPermissionManager_1.AppPermissionManager.notifyAboutError(new PermissionDeniedError_1.PermissionDeniedError({
            appId,
            missingPermissions: [AppPermissions_1.AppPermissions.ui.registerButtons],
        }));
        return false;
    }
}
exports.UIActionButtonManager = UIActionButtonManager;
//# sourceMappingURL=UIActionButtonManager.js.map