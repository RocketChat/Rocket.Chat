"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceContext = exports.isDeviceContextEnabled = void 0;
const react_1 = require("react");
const isDeviceContextEnabled = (context) => context.enabled;
exports.isDeviceContextEnabled = isDeviceContextEnabled;
exports.DeviceContext = (0, react_1.createContext)({
    enabled: false,
});
//# sourceMappingURL=DeviceContext.js.map