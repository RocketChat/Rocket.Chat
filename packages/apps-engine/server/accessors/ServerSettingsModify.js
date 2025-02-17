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
exports.ServerSettingsModify = void 0;
class ServerSettingsModify {
    constructor(bridge, appId) {
        this.bridge = bridge;
        this.appId = appId;
    }
    hideGroup(name) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.bridge.doHideGroup(name, this.appId);
        });
    }
    hideSetting(id) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.bridge.doHideSetting(id, this.appId);
        });
    }
    modifySetting(setting) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.bridge.doUpdateOne(setting, this.appId);
        });
    }
    incrementValue(id_1) {
        return __awaiter(this, arguments, void 0, function* (id, value = 1) {
            yield this.bridge.doIncrementValue(id, value, this.appId);
        });
    }
}
exports.ServerSettingsModify = ServerSettingsModify;
//# sourceMappingURL=ServerSettingsModify.js.map