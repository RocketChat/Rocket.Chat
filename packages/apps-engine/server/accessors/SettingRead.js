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
exports.SettingRead = void 0;
class SettingRead {
    constructor(app) {
        this.app = app;
    }
    getById(id) {
        return Promise.resolve(this.app.getStorageItem().settings[id]);
    }
    getValueById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const set = yield this.getById(id);
            if (typeof set === 'undefined') {
                throw new Error(`Setting "${id}" does not exist.`);
            }
            if (set.value === undefined || set.value === null) {
                return set.packageValue;
            }
            return set.value;
        });
    }
}
exports.SettingRead = SettingRead;
//# sourceMappingURL=SettingRead.js.map