"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthorizationContext = void 0;
const react_1 = require("react");
exports.AuthorizationContext = (0, react_1.createContext)({
    queryPermission: () => [() => () => undefined, () => false],
    queryAtLeastOnePermission: () => [() => () => undefined, () => false],
    queryAllPermissions: () => [() => () => undefined, () => false],
    queryRole: () => [() => () => undefined, () => false],
    roleStore: {
        roles: {},
        emit: () => undefined,
        on: () => () => undefined,
        off: () => undefined,
        events: () => ['change'],
        has: () => false,
        once: () => () => undefined,
    },
});
//# sourceMappingURL=AuthorizationContext.js.map