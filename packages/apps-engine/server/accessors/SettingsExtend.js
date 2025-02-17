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
exports.SettingsExtend = void 0;
class SettingsExtend {
    constructor(app) {
        this.app = app;
    }
    provideSetting(setting) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.app.getStorageItem().settings[setting.id]) {
                // :see_no_evil:
                const old = yield Promise.resolve(this.app.getStorageItem().settings[setting.id]);
                setting.createdAt = old.createdAt;
                setting.updatedAt = new Date();
                setting.value = old.value;
                this.app.getStorageItem().settings[setting.id] = setting;
                return;
            }
            setting.createdAt = new Date();
            setting.updatedAt = new Date();
            this.app.getStorageItem().settings[setting.id] = setting;
        });
    }
}
exports.SettingsExtend = SettingsExtend;
//# sourceMappingURL=SettingsExtend.js.map