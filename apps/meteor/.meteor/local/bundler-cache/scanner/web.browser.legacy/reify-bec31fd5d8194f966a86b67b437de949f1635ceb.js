"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSettings = void 0;
const react_1 = require("react");
const shim_1 = require("use-sync-external-store/shim");
const SettingsContext_1 = require("../SettingsContext");
const useSettings = (query) => {
    const { querySettings } = (0, react_1.useContext)(SettingsContext_1.SettingsContext);
    const [subscribe, getSnapshot] = (0, react_1.useMemo)(() => querySettings(query !== null && query !== void 0 ? query : {}), [querySettings, query]);
    return (0, shim_1.useSyncExternalStore)(subscribe, getSnapshot);
};
exports.useSettings = useSettings;
//# sourceMappingURL=useSettings.js.map