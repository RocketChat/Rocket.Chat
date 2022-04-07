"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var InputBlock = function (_a) {
    var className = _a.className, block = _a.block, surfaceRenderer = _a.surfaceRenderer, context = _a.context;
    var inputElement = react_1.useMemo(function () {
        var _a, _b;
        return (__assign(__assign({}, block.element), { appId: (_a = block.element.appId) !== null && _a !== void 0 ? _a : block.appId, blockId: (_b = block.element.blockId) !== null && _b !== void 0 ? _b : block.blockId }));
    }, [block.element, block.appId, block.blockId]);
    var error = useUiKitState_1.useUiKitState(inputElement, context)[0].error;
    return (react_1.default.createElement(fuselage_1.Field, { className: className },
        block.label && (react_1.default.createElement(fuselage_1.Field.Label, null, surfaceRenderer.renderTextObject(block.label, 0, UiKit.BlockContext.NONE))),
        react_1.default.createElement(fuselage_1.Field.Row, null, surfaceRenderer.renderInputBlockElement(inputElement, 0)),
        error && react_1.default.createElement(fuselage_1.Field.Error, null, error),
        block.hint && react_1.default.createElement(fuselage_1.Field.Hint, null, block.hint)));
};
exports.default = react_1.memo(InputBlock);
//# sourceMappingURL=InputBlock.js.map