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
exports.OAuthAppsReader = void 0;
class OAuthAppsReader {
    constructor(oauthAppsBridge, appId) {
        this.oauthAppsBridge = oauthAppsBridge;
        this.appId = appId;
    }
    getOAuthAppById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.oauthAppsBridge.doGetByid(id, this.appId);
        });
    }
    getOAuthAppByName(name) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.oauthAppsBridge.doGetByName(name, this.appId);
        });
    }
}
exports.OAuthAppsReader = OAuthAppsReader;
//# sourceMappingURL=OAuthAppsReader.js.map