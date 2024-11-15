"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSettingAsset = exports.isSettingAction = exports.isSettingCode = exports.isSettingColor = exports.isSettingEnterprise = exports.isDateSetting = exports.isSetting = exports.SettingEditor = void 0;
var SettingEditor;
(function (SettingEditor) {
    SettingEditor["COLOR"] = "color";
    SettingEditor["EXPRESSION"] = "expression";
})(SettingEditor || (exports.SettingEditor = SettingEditor = {}));
// Checks if setting has at least the required properties
const isSetting = (setting) => '_id' in setting &&
    'type' in setting &&
    'public' in setting &&
    'value' in setting &&
    'packageValue' in setting &&
    'blocked' in setting &&
    'sorter' in setting &&
    'i18nLabel' in setting;
exports.isSetting = isSetting;
const isDateSetting = (setting) => setting.type === 'date';
exports.isDateSetting = isDateSetting;
const isSettingEnterprise = (setting) => setting.enterprise === true;
exports.isSettingEnterprise = isSettingEnterprise;
const isSettingColor = (setting) => setting.type === 'color';
exports.isSettingColor = isSettingColor;
const isSettingCode = (setting) => setting.type === 'code';
exports.isSettingCode = isSettingCode;
const isSettingAction = (setting) => setting.type === 'action';
exports.isSettingAction = isSettingAction;
const isSettingAsset = (setting) => setting.type === 'asset';
exports.isSettingAsset = isSettingAsset;
//# sourceMappingURL=ISetting.js.map