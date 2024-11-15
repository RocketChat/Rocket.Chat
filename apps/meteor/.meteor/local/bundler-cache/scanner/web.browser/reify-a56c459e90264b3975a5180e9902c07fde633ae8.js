"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useMethod = void 0;
const react_1 = require("react");
const ServerContext_1 = require("../ServerContext");
/* @deprecated prefer the use of api endpoints (useEndpoint) */
const useMethod = (methodName) => {
    const { callMethod } = (0, react_1.useContext)(ServerContext_1.ServerContext);
    return (0, react_1.useCallback)((...args) => {
        if (!callMethod) {
            throw new Error(`cannot use useMethod(${methodName}) hook without a wrapping ServerContext`);
        }
        return callMethod(methodName, ...args);
    }, [callMethod, methodName]);
};
exports.useMethod = useMethod;
//# sourceMappingURL=useMethod.js.map