"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useUpload = void 0;
const react_1 = require("react");
const ServerContext_1 = require("../ServerContext");
const useUpload = (endpoint) => {
    const { uploadToEndpoint } = (0, react_1.useContext)(ServerContext_1.ServerContext);
    return (0, react_1.useCallback)((formData) => uploadToEndpoint(endpoint, formData), [endpoint, uploadToEndpoint]);
};
exports.useUpload = useUpload;
//# sourceMappingURL=useUpload.js.map