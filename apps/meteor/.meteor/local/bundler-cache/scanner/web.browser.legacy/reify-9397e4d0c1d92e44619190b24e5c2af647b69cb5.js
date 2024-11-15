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
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const fuselage_1 = require("@rocket.chat/fuselage");
const UiKit = __importStar(require("@rocket.chat/ui-kit"));
const react_1 = require("react");
const useUiKitState_1 = require("../hooks/useUiKitState");
const InputBlock = ({ className, block, surfaceRenderer, context, }) => {
    const inputElement = (0, react_1.useMemo)(() => {
        var _a, _b;
        return (Object.assign(Object.assign({}, block.element), { appId: (_a = block.element.appId) !== null && _a !== void 0 ? _a : block.appId, blockId: (_b = block.element.blockId) !== null && _b !== void 0 ? _b : block.blockId }));
    }, [block.element, block.appId, block.blockId]);
    const [{ error }] = (0, useUiKitState_1.useUiKitState)(inputElement, context);
    return ((0, jsx_runtime_1.jsxs)(fuselage_1.Field, { className: className, children: [block.label && ((0, jsx_runtime_1.jsx)(fuselage_1.FieldLabel, { children: surfaceRenderer.renderTextObject(block.label, 0, UiKit.BlockContext.NONE) })), (0, jsx_runtime_1.jsx)(fuselage_1.FieldRow, { children: surfaceRenderer.renderInputBlockElement(inputElement, 0) }), error && (0, jsx_runtime_1.jsx)(fuselage_1.FieldError, { children: error }), block.hint && ((0, jsx_runtime_1.jsx)(fuselage_1.FieldHint, { children: surfaceRenderer.renderTextObject(block.hint, 0, UiKit.BlockContext.NONE) }))] }));
};
exports.default = (0, react_1.memo)(InputBlock);
//# sourceMappingURL=InputBlock.js.map