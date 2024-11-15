"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UiKitContext = void 0;
const react_1 = require("react");
exports.UiKitContext = (0, react_1.createContext)({
    action: () => undefined,
    updateState: () => undefined,
    appId: 'core',
    values: {},
});
Object.assign(exports.UiKitContext.Provider, { displayName: 'UiKitContext.Provider' });
//# sourceMappingURL=UiKitContext.js.map