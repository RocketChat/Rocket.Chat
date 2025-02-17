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
exports.OAuthAppsModify = void 0;
class OAuthAppsModify {
    constructor(oauthAppsBridge, appId) {
        this.oauthAppsBridge = oauthAppsBridge;
        this.appId = appId;
    }
    createOAuthApp(oAuthApp) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.oauthAppsBridge.doCreate(oAuthApp, this.appId);
        });
    }
    updateOAuthApp(oAuthApp, id) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.oauthAppsBridge.doUpdate(oAuthApp, id, this.appId);
        });
    }
    deleteOAuthApp(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.oauthAppsBridge.doDelete(id, this.appId);
        });
    }
}
exports.OAuthAppsModify = OAuthAppsModify;
//# sourceMappingURL=OAuthAppsModify.js.map