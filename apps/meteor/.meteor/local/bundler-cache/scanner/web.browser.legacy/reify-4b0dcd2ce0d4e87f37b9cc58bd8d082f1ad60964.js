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
const LinearScaleElement = ({ className, block, context, surfaceRenderer, }) => {
    const { minValue = 0, maxValue = 10, initialValue, preLabel, postLabel, } = block;
    const [{ loading, value = initialValue, error }, action] = (0, useUiKitState_1.useUiKitState)(block, context);
    const points = (0, react_1.useMemo)(() => Array.from({ length: Math.max(maxValue - minValue + 1, 1) }, (_, i) => String(minValue + i)), [maxValue, minValue]);
    return ((0, jsx_runtime_1.jsxs)(fuselage_1.Box, { display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'center', children: [preLabel && ((0, jsx_runtime_1.jsx)(fuselage_1.Box, { fontScale: 'c2', paddingInlineEnd: 8, textAlign: 'start', children: surfaceRenderer.renderTextObject(preLabel, 0, UiKit.BlockContext.NONE) })), (0, jsx_runtime_1.jsx)(fuselage_1.Box, { children: (0, jsx_runtime_1.jsx)(fuselage_1.ButtonGroup, { className: className, align: 'center', children: points.map((point, i) => ((0, jsx_runtime_1.jsx)(fuselage_1.Button, { className: point === String(value) ? 'active' : undefined, disabled: loading, danger: !!error, minWidth: '4ch', small: true, value: point, marginInline: 2, flexShrink: 1, onClick: action, children: surfaceRenderer.renderTextObject({
                            type: 'plain_text',
                            text: String(i + minValue),
                        }, 0, UiKit.BlockContext.NONE) }, i))) }) }), postLabel && ((0, jsx_runtime_1.jsx)(fuselage_1.Box, { fontScale: 'c2', paddingInlineStart: 8, textAlign: 'end', children: surfaceRenderer.renderTextObject(postLabel, 0, UiKit.BlockContext.NONE) }))] }));
};
exports.default = (0, react_1.memo)(LinearScaleElement);
//# sourceMappingURL=LinearScaleElement.js.map