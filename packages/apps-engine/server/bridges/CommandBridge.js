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
exports.CommandBridge = void 0;
const BaseBridge_1 = require("./BaseBridge");
const PermissionDeniedError_1 = require("../errors/PermissionDeniedError");
const AppPermissionManager_1 = require("../managers/AppPermissionManager");
const AppPermissions_1 = require("../permissions/AppPermissions");
class CommandBridge extends BaseBridge_1.BaseBridge {
    doDoesCommandExist(command, appId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.hasDefaultPermission(appId)) {
                return this.doesCommandExist(command, appId);
            }
        });
    }
    doEnableCommand(command, appId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.hasDefaultPermission(appId)) {
                return this.enableCommand(command, appId);
            }
        });
    }
    doDisableCommand(command, appId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.hasDefaultPermission(appId)) {
                return this.disableCommand(command, appId);
            }
        });
    }
    doModifyCommand(command, appId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.hasDefaultPermission(appId)) {
                return this.modifyCommand(command, appId);
            }
        });
    }
    doRegisterCommand(command, appId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.hasDefaultPermission(appId)) {
                return this.registerCommand(command, appId);
            }
        });
    }
    doUnregisterCommand(command, appId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.hasDefaultPermission(appId)) {
                return this.unregisterCommand(command, appId);
            }
        });
    }
    hasDefaultPermission(appId) {
        if (AppPermissionManager_1.AppPermissionManager.hasPermission(appId, AppPermissions_1.AppPermissions.command.default)) {
            return true;
        }
        AppPermissionManager_1.AppPermissionManager.notifyAboutError(new PermissionDeniedError_1.PermissionDeniedError({
            appId,
            missingPermissions: [AppPermissions_1.AppPermissions.command.default],
        }));
        return false;
    }
}
exports.CommandBridge = CommandBridge;
//# sourceMappingURL=CommandBridge.js.map