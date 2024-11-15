"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectionStatusContext = void 0;
const react_1 = require("react");
exports.ConnectionStatusContext = (0, react_1.createContext)({
    connected: true,
    status: 'connected',
    reconnect: () => undefined,
});
//# sourceMappingURL=ConnectionStatusContext.js.map