"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttachmentContext = void 0;
const react_1 = require("react");
exports.AttachmentContext = (0, react_1.createContext)({
    getURL: (url) => url,
    dimensions: {
        width: 368,
        height: 368,
    },
    collapsedByDefault: false,
    autoLoadEmbedMedias: true,
});
//# sourceMappingURL=AttachmentContext.js.map