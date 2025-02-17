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
exports.SettingUpdater = void 0;
class SettingUpdater {
    constructor(app, manager) {
        this.app = app;
        this.manager = manager;
    }
    updateValue(id, value) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.app.getStorageItem().settings[id]) {
                return;
            }
            const setting = this.manager.getAppSetting(this.app.getID(), id);
            this.manager.updateAppSetting(this.app.getID(), Object.assign(Object.assign({}, setting), { updatedAt: new Date(), value }));
        });
    }
}
exports.SettingUpdater = SettingUpdater;
//# sourceMappingURL=SettingUpdater.js.map