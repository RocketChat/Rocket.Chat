"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const fuselage_1 = require("@rocket.chat/fuselage");
const UiKit = __importStar(require("@rocket.chat/ui-kit"));
const react_1 = require("react");
const useSurfaceType_1 = require("../hooks/useSurfaceType");
const ActionsBlock_Action_1 = __importDefault(require("./ActionsBlock.Action"));
const ActionsBlock = ({ className, block, surfaceRenderer, }) => {
    const surfaceType = (0, useSurfaceType_1.useSurfaceType)();
    const [showMoreVisible, setShowMoreVisible] = (0, react_1.useState)(() => block.elements.length > 5 && surfaceType !== 'banner');
    const handleShowMoreClick = (0, react_1.useCallback)(() => {
        setShowMoreVisible(false);
    }, []);
    const actionElements = (0, react_1.useMemo)(() => (showMoreVisible ? block.elements.slice(0, 5) : block.elements).map((element) => {
        var _a, _b;
        return (Object.assign(Object.assign({}, element), { appId: (_a = element.appId) !== null && _a !== void 0 ? _a : block.appId, blockId: (_b = element.blockId) !== null && _b !== void 0 ? _b : block.blockId }));
    }), [block.appId, block.blockId, block.elements, showMoreVisible]);
    return ((0, jsx_runtime_1.jsxs)(fuselage_1.Box, { className: className, display: 'flex', flexWrap: 'wrap', margin: -4, children: [actionElements.map((element, i) => ((0, jsx_runtime_1.jsx)(ActionsBlock_Action_1.default, { element: element, parser: surfaceRenderer, index: i }, i))), showMoreVisible && ((0, jsx_runtime_1.jsx)(fuselage_1.Box, { display: 'flex', margin: 4, children: (0, jsx_runtime_1.jsx)(fuselage_1.Button, { small: true, onClick: handleShowMoreClick, children: surfaceRenderer.renderTextObject({ type: 'plain_text', text: 'Show more...' }, 0, UiKit.BlockContext.NONE) }) }))] }));
};
exports.default = (0, react_1.memo)(ActionsBlock);
//# sourceMappingURL=ActionsBlock.js.map