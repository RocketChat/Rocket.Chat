"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useServerInformation = void 0;
const react_1 = require("react");
const ServerContext_1 = require("../ServerContext");
const useServerInformation = () => {
    const { info } = (0, react_1.useContext)(ServerContext_1.ServerContext);
    if (!info) {
        throw new Error('useServerInformation: no info available');
    }
    return info;
};
exports.useServerInformation = useServerInformation;
//# sourceMappingURL=useServerInformation.js.map