"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LayoutContext = void 0;
const react_1 = require("react");
exports.LayoutContext = (0, react_1.createContext)({
    isEmbedded: false,
    showTopNavbarEmbeddedLayout: false,
    isMobile: false,
    roomToolboxExpanded: true,
    sidebar: {
        isCollapsed: false,
        toggle: () => undefined,
        collapse: () => undefined,
        expand: () => undefined,
        close: () => undefined,
    },
    size: {
        sidebar: '380px',
        contextualBar: '380px',
    },
    contextualBarPosition: 'relative',
    contextualBarExpanded: false,
    hiddenActions: {
        roomToolbox: [],
        messageToolbox: [],
        composerToolbox: [],
        userToolbox: [],
    },
});
//# sourceMappingURL=LayoutContext.js.map