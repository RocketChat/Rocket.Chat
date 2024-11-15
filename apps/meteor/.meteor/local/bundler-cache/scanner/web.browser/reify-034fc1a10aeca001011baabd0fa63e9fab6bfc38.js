"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSettingStructure = void 0;
const react_1 = require("react");
const shim_1 = require("use-sync-external-store/shim");
const SettingsContext_1 = require("../SettingsContext");
const useSettingStructure = (_id) => {
    const { querySetting } = (0, react_1.useContext)(SettingsContext_1.SettingsContext);
    const [subscribe, getSnapshot] = (0, react_1.useMemo)(() => querySetting(_id), [querySetting, _id]);
    return (0, shim_1.useSyncExternalStore)(subscribe, getSnapshot);
};
exports.useSettingStructure = useSettingStructure;
//# sourceMappingURL=useSettingStructure.js.map