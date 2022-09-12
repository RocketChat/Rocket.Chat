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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var fuselage_1 = require("@rocket.chat/fuselage");
var UiKit = __importStar(require("@rocket.chat/ui-kit"));
var react_1 = __importDefault(require("react"));
var useUiKitState_1 = require("../hooks/useUiKitState");
var ButtonElement = function (_a) {
    var block = _a.block, context = _a.context, surfaceRenderer = _a.surfaceRenderer;
    var _b = useUiKitState_1.useUiKitState(block, context), loading = _b[0].loading, action = _b[1];
    if (block.url) {
        return (react_1.default.createElement(fuselage_1.Button, { is: 'a', target: '_blank', href: block.url, disabled: loading, primary: block.style === 'primary', danger: block.style === 'danger', minWidth: '4ch', small: true, onClick: action }, loading ? (react_1.default.createElement(fuselage_1.Throbber, null)) : (surfaceRenderer.renderTextObject(block.text, 0, UiKit.BlockContext.NONE))));
    }
    return (react_1.default.createElement(fuselage_1.Button, { disabled: loading, primary: block.style === 'primary', danger: block.style === 'danger', minWidth: '4ch', small: true, value: block.value, onClick: action }, loading ? (react_1.default.createElement(fuselage_1.Throbber, null)) : (surfaceRenderer.renderTextObject(block.text, 0, UiKit.BlockContext.NONE))));
};
exports.default = ButtonElement;
//# sourceMappingURL=ButtonElement.js.map