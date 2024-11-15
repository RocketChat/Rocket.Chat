"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAttachmentDimensions = void 0;
const react_1 = require("react");
const AttachmentContext_1 = require("../AttachmentContext");
const useAttachmentDimensions = () => (0, react_1.useContext)(AttachmentContext_1.AttachmentContext).dimensions;
exports.useAttachmentDimensions = useAttachmentDimensions;
//# sourceMappingURL=useAttachmentDimensions.js.map