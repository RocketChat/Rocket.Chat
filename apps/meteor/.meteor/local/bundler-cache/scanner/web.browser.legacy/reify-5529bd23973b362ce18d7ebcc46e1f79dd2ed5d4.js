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
exports.TabElement = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const fuselage_1 = require("@rocket.chat/fuselage");
const UiKit = __importStar(require("@rocket.chat/ui-kit"));
const useUiKitState_1 = require("../hooks/useUiKitState");
const TabElement = ({ block, context, surfaceRenderer, index, select, }) => {
    const [{ loading }, action] = (0, useUiKitState_1.useUiKitState)(block, context);
    const { title, selected, disabled } = block;
    return ((0, jsx_runtime_1.jsx)(fuselage_1.TabsItem, { selected: selected, disabled: loading ? true : disabled, onClick: (e) => {
            !disabled && select(index);
            !disabled && action(e);
        }, children: surfaceRenderer.renderTextObject(title, 0, UiKit.BlockContext.NONE) }));
};
exports.TabElement = TabElement;
//# sourceMappingURL=TabElement.js.map