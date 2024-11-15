"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSettingSetValue = void 0;
const react_1 = require("react");
const useSettingsDispatch_1 = require("./useSettingsDispatch");
const useSettingSetValue = (_id) => {
    const dispatch = (0, useSettingsDispatch_1.useSettingsDispatch)();
    return (0, react_1.useCallback)((value) => dispatch([{ _id, value }]), [dispatch, _id]);
};
exports.useSettingSetValue = useSettingSetValue;
//# sourceMappingURL=useSettingSetValue.js.map