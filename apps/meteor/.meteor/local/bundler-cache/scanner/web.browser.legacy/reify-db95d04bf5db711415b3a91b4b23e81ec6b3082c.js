"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAttachmentIsCollapsedByDefault = void 0;
const react_1 = require("react");
const AttachmentContext_1 = require("../AttachmentContext");
const useAttachmentIsCollapsedByDefault = () => (0, react_1.useContext)(AttachmentContext_1.AttachmentContext).collapsedByDefault;
exports.useAttachmentIsCollapsedByDefault = useAttachmentIsCollapsedByDefault;
//# sourceMappingURL=useAttachmentIsCollapsedByDefault.js.map