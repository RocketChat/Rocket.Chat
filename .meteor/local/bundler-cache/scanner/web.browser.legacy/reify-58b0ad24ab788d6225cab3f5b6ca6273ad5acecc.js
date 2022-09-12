"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
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
var fuselage_1 = require("@rocket.chat/fuselage");
var UiKit = __importStar(require("@rocket.chat/ui-kit"));
var react_1 = __importStar(require("react"));
var useUiKitState_1 = require("../hooks/useUiKitState");
var LinearScaleElement = function (_a) {
    var className = _a.className, block = _a.block, context = _a.context, surfaceRenderer = _a.surfaceRenderer;
    var _b = block.minValue, minValue = _b === void 0 ? 0 : _b, _c = block.maxValue, maxValue = _c === void 0 ? 10 : _c, initialValue = block.initialValue, preLabel = block.preLabel, postLabel = block.postLabel;
    var _d = useUiKitState_1.useUiKitState(block, context), _e = _d[0], loading = _e.loading, _f = _e.value, value = _f === void 0 ? initialValue : _f, error = _e.error, action = _d[1];
    var points = react_1.useMemo(function () {
        return Array.from({ length: Math.max(maxValue - minValue + 1, 1) }, function (_, i) {
            return String(minValue + i);
        });
    }, [maxValue, minValue]);
    return (react_1.default.createElement(fuselage_1.Box, { display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'center' },
        preLabel && (react_1.default.createElement(fuselage_1.Box, { fontScale: 'c2', paddingInlineEnd: 8, textAlign: 'start' }, surfaceRenderer.renderTextObject(preLabel, 0, UiKit.BlockContext.NONE))),
        react_1.default.createElement(fuselage_1.Box, null,
            react_1.default.createElement(fuselage_1.ButtonGroup, { className: className, align: 'center', marginInline: -2, minWidth: 0 }, points.map(function (point, i) { return (react_1.default.createElement(fuselage_1.Button, { key: i, className: point === String(value) ? 'active' : undefined, disabled: loading, danger: !!error, minWidth: '4ch', small: true, value: point, marginInline: 2, flexShrink: 1, onClick: action }, surfaceRenderer.renderTextObject({
                type: 'plain_text',
                text: String(i + minValue),
            }, 0, UiKit.BlockContext.NONE))); }))),
        postLabel && (react_1.default.createElement(fuselage_1.Box, { fontScale: 'c2', paddingInlineStart: 8, textAlign: 'end' }, surfaceRenderer.renderTextObject(postLabel, 0, UiKit.BlockContext.NONE)))));
};
exports.default = react_1.memo(LinearScaleElement);
//# sourceMappingURL=LinearScaleElement.js.map