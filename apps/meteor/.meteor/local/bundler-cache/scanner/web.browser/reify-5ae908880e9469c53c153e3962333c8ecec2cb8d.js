"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSetting = useSetting;
const useSettingStructure_1 = require("./useSettingStructure");
function useSetting(settingId, fallbackValue) {
    var _a;
    const setting = (0, useSettingStructure_1.useSettingStructure)(settingId);
    return (_a = setting === null || setting === void 0 ? void 0 : setting.value) !== null && _a !== void 0 ? _a : fallbackValue;
}
//# sourceMappingURL=useSetting.js.map