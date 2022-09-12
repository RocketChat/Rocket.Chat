"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var fuselage_1 = require("@rocket.chat/fuselage");
var react_1 = __importDefault(require("react"));
var useUiKitState_1 = require("../hooks/useUiKitState");
var fromTextObjectToString_1 = require("../utils/fromTextObjectToString");
var DatePickerElement = function (_a) {
    var block = _a.block, context = _a.context, surfaceRenderer = _a.surfaceRenderer;
    var _b = useUiKitState_1.useUiKitState(block, context), _c = _b[0], loading = _c.loading, value = _c.value, error = _c.error, action = _b[1];
    var actionId = block.actionId, placeholder = block.placeholder;
    return (react_1.default.createElement(fuselage_1.InputBox, { type: 'date', error: error, value: value, disabled: loading, id: actionId, name: actionId, rows: 6, placeholder: placeholder
            ? fromTextObjectToString_1.fromTextObjectToString(surfaceRenderer, placeholder, 0)
            : undefined, onInput: action }));
};
exports.default = DatePickerElement;
//# sourceMappingURL=DatePickerElement.js.map