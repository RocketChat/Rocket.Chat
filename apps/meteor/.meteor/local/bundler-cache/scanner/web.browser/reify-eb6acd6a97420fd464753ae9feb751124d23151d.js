"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useIsSettingsContextLoading = void 0;
const react_1 = require("react");
const SettingsContext_1 = require("../SettingsContext");
const useIsSettingsContextLoading = () => (0, react_1.useContext)(SettingsContext_1.SettingsContext).isLoading;
exports.useIsSettingsContextLoading = useIsSettingsContextLoading;
//# sourceMappingURL=useIsSettingsContextLoading.js.map