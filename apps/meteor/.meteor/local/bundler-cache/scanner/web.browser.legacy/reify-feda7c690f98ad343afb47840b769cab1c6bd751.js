"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useIsDeviceManagementEnabled = void 0;
const react_1 = require("react");
const DeviceContext_1 = require("../DeviceContext");
const useIsDeviceManagementEnabled = () => (0, react_1.useContext)(DeviceContext_1.DeviceContext).enabled;
exports.useIsDeviceManagementEnabled = useIsDeviceManagementEnabled;
//# sourceMappingURL=useIsDeviceManagementEnabled.js.map