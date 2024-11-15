"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useMediaUrl = void 0;
const react_1 = require("react");
const AttachmentContext_1 = require("../AttachmentContext");
const useMediaUrl = () => {
    const { getURL } = (0, react_1.useContext)(AttachmentContext_1.AttachmentContext);
    return getURL;
};
exports.useMediaUrl = useMediaUrl;
//# sourceMappingURL=useMediaUrl.js.map