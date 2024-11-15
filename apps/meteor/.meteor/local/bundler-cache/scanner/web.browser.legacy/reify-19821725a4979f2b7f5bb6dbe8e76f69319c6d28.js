"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionContext = void 0;
const react_1 = require("react");
exports.SessionContext = (0, react_1.createContext)({
    query: () => [() => () => undefined, () => undefined],
    dispatch: () => undefined,
});
//# sourceMappingURL=SessionContext.js.map