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
const useUiKitState_1 = require("../hooks/useUiKitState");
const RadioButtonElement = ({ block, context, surfaceRenderer, }) => {
    const [{ loading, value }, action] = (0, useUiKitState_1.useUiKitState)(block, context);
    const { options } = block;
    return ((0, jsx_runtime_1.jsx)(fuselage_1.Box, { children: options.map((option) => {
            return ((0, jsx_runtime_1.jsxs)(fuselage_1.Box, { pb: 4, children: [(0, jsx_runtime_1.jsx)(fuselage_1.RadioButton, { disabled: loading, checked: value === option.value, value: option.value, onChange: action }), (0, jsx_runtime_1.jsx)(fuselage_1.Box, { is: 'label', pis: 8, children: surfaceRenderer.renderTextObject(option.text, 0, UiKit.BlockContext.NONE) })] }, option.value));
        }) }));
};
exports.default = RadioButtonElement;
//# sourceMappingURL=RadioButtonElement.js.map