"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useIsPrivilegedSettingsContext = void 0;
const react_1 = require("react");
const SettingsContext_1 = require("../SettingsContext");
const useIsPrivilegedSettingsContext = () => (0, react_1.useContext)(SettingsContext_1.SettingsContext).hasPrivateAccess;
exports.useIsPrivilegedSettingsContext = useIsPrivilegedSettingsContext;
//# sourceMappingURL=useIsPrivilegedSettingsContext.js.map