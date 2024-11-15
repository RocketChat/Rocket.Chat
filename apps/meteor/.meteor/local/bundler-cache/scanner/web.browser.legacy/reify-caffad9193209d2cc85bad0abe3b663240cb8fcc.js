"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const fuselage_1 = require("@rocket.chat/fuselage");
const useStringFromTextObject_1 = require("../hooks/useStringFromTextObject");
const useUiKitState_1 = require("../hooks/useUiKitState");
const TimePickerElement = ({ block, context, }) => {
    const [{ loading, value, error }, action] = (0, useUiKitState_1.useUiKitState)(block, context);
    const { actionId, placeholder } = block;
    const fromTextObjectToString = (0, useStringFromTextObject_1.useStringFromTextObject)();
    return ((0, jsx_runtime_1.jsx)(fuselage_1.InputBox, { type: 'time', error: error, value: value, disabled: loading, id: actionId, name: actionId, rows: 6, placeholder: fromTextObjectToString(placeholder), onInput: action }));
};
exports.default = TimePickerElement;
//# sourceMappingURL=TimePickerElement.js.map