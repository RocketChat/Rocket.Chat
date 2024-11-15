"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useEndpoint = useEndpoint;
const react_1 = require("react");
const ServerContext_1 = require("../ServerContext");
function useEndpoint(method, pathPattern, ...[keys]) {
    const { callEndpoint } = (0, react_1.useContext)(ServerContext_1.ServerContext);
    const keysRef = (0, react_1.useRef)(keys);
    keysRef.current = keys;
    return (0, react_1.useCallback)((params) => callEndpoint({
        method,
        pathPattern,
        keys: keysRef.current,
        params: params,
    }), [callEndpoint, pathPattern, method]);
}
//# sourceMappingURL=useEndpoint.js.map