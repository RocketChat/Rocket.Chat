"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingType = void 0;
var SettingType;
(function (SettingType) {
    SettingType["BOOLEAN"] = "boolean";
    SettingType["CODE"] = "code";
    SettingType["COLOR"] = "color";
    SettingType["FONT"] = "font";
    SettingType["NUMBER"] = "int";
    SettingType["SELECT"] = "select";
    SettingType["STRING"] = "string";
    SettingType["MULTI_SELECT"] = "multiSelect";
    // Renders an input of type 'password' in the form. IMPORTANT - the value will NOT be encrypted
    // it will be treated as a password just on the screen
    SettingType["PASSWORD"] = "password";
    SettingType["ROOM_PICK"] = "roomPick";
})(SettingType || (exports.SettingType = SettingType = {}));
//# sourceMappingURL=SettingType.js.map