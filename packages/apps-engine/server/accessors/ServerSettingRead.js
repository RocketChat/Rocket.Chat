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
exports.ServerSettingRead = void 0;
class ServerSettingRead {
    constructor(settingBridge, appId) {
        this.settingBridge = settingBridge;
        this.appId = appId;
    }
    getOneById(id) {
        return this.settingBridge.doGetOneById(id, this.appId);
    }
    getValueById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const set = yield this.settingBridge.doGetOneById(id, this.appId);
            if (typeof set === 'undefined') {
                throw new Error(`No Server Setting found, or it is unaccessible, by the id of "${id}".`);
            }
            if (set.value === undefined || set.value === null) {
                return set.packageValue;
            }
            return set.value;
        });
    }
    getAll() {
        throw new Error('Method not implemented.');
        // return this.settingBridge.getAll(this.appId);
    }
    isReadableById(id) {
        return this.settingBridge.doIsReadableById(id, this.appId);
    }
}
exports.ServerSettingRead = ServerSettingRead;
//# sourceMappingURL=ServerSettingRead.js.map