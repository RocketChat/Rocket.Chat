"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserContext = void 0;
const react_1 = require("react");
exports.UserContext = (0, react_1.createContext)({
    userId: null,
    user: null,
    queryPreference: () => [() => () => undefined, () => undefined],
    querySubscription: () => [() => () => undefined, () => undefined],
    queryRoom: () => [() => () => undefined, () => undefined],
    querySubscriptions: () => [() => () => undefined, () => []],
    logout: () => Promise.resolve(),
});
//# sourceMappingURL=UserContext.js.map