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
exports.AppSettingsManager = void 0;
const metadata_1 = require("../../definition/metadata");
const Utilities_1 = require("../misc/Utilities");
class AppSettingsManager {
    constructor(manager) {
        this.manager = manager;
    }
    getAppSettings(appId) {
        const rl = this.manager.getOneById(appId);
        if (!rl) {
            throw new Error('No App found by the provided id.');
        }
        return Utilities_1.Utilities.deepCloneAndFreeze(rl.getStorageItem().settings);
    }
    getAppSetting(appId, settingId) {
        const settings = this.getAppSettings(appId);
        if (!settings[settingId]) {
            throw new Error('No setting found for the App by the provided id.');
        }
        return Utilities_1.Utilities.deepCloneAndFreeze(settings[settingId]);
    }
    updateAppSetting(appId, setting) {
        return __awaiter(this, void 0, void 0, function* () {
            const rl = this.manager.getOneById(appId);
            if (!rl) {
                throw new Error('No App found by the provided id.');
            }
            const oldSetting = rl.getStorageItem().settings[setting.id];
            if (!oldSetting) {
                throw new Error('No setting found for the App by the provided id.');
            }
            const decoratedSetting = (yield rl.call(metadata_1.AppMethod.ON_PRE_SETTING_UPDATE, { oldSetting, newSetting: setting })) || setting;
            decoratedSetting.updatedAt = new Date();
            rl.getStorageItem().settings[decoratedSetting.id] = decoratedSetting;
            const item = yield this.manager.getStorage().update(rl.getStorageItem());
            rl.setStorageItem(item);
            this.manager.getBridges().getAppDetailChangesBridge().doOnAppSettingsChange(appId, decoratedSetting);
            yield rl.call(metadata_1.AppMethod.ONSETTINGUPDATED, decoratedSetting);
        });
    }
}
exports.AppSettingsManager = AppSettingsManager;
//# sourceMappingURL=AppSettingsManager.js.map