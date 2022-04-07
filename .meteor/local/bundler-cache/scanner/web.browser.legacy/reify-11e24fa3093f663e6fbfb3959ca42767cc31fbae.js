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
var react_1 = __importStar(require("react"));
var useUiKitState_1 = require("../hooks/useUiKitState");
var fromTextObjectToString_1 = require("../utils/fromTextObjectToString");
var PlainTextInputElement = function (_a) {
    var block = _a.block, context = _a.context, surfaceRenderer = _a.surfaceRenderer;
    var _b = useUiKitState_1.useUiKitState(block, context), _c = _b[0], loading = _c.loading, value = _c.value, error = _c.error, action = _b[1];
    if (block.multiline) {
        return (react_1.default.createElement(fuselage_1.TextAreaInput, { disabled: loading, id: block.actionId, name: block.actionId, rows: 6, error: error, value: value, onChange: action, placeholder: block.placeholder
                ? fromTextObjectToString_1.fromTextObjectToString(surfaceRenderer, block.placeholder, 0)
                : undefined }));
    }
    return (react_1.default.createElement(fuselage_1.TextInput, { disabled: loading, id: block.actionId, name: block.actionId, error: error, value: value, onChange: action, placeholder: block.placeholder
            ? fromTextObjectToString_1.fromTextObjectToString(surfaceRenderer, block.placeholder, 0)
            : undefined }));
};
exports.default = react_1.memo(PlainTextInputElement);
//# sourceMappingURL=PlainTextInputElement.js.map