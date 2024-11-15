"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSettingsDispatch = void 0;
const react_1 = require("react");
const SettingsContext_1 = require("../SettingsContext");
const useSettingsDispatch = () => (0, react_1.useContext)(SettingsContext_1.SettingsContext).dispatch;
exports.useSettingsDispatch = useSettingsDispatch;
//# sourceMappingURL=useSettingsDispatch.js.map