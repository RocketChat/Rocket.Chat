"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const fuselage_1 = require("@rocket.chat/fuselage");
const react_1 = require("react");
const useStringFromTextObject_1 = require("../hooks/useStringFromTextObject");
const useUiKitState_1 = require("../hooks/useUiKitState");
const PlainTextInputElement = ({ block, context, }) => {
    const [{ loading, value, error }, action] = (0, useUiKitState_1.useUiKitState)(block, context);
    const fromTextObjectToString = (0, useStringFromTextObject_1.useStringFromTextObject)();
    if (block.multiline) {
        return ((0, jsx_runtime_1.jsx)(fuselage_1.TextAreaInput, { disabled: loading, id: block.actionId, name: block.actionId, rows: 6, error: error, value: value, onChange: action, placeholder: fromTextObjectToString(block.placeholder) }));
    }
    return ((0, jsx_runtime_1.jsx)(fuselage_1.TextInput, { disabled: loading, id: block.actionId, name: block.actionId, error: error, value: value, onChange: action, placeholder: fromTextObjectToString(block.placeholder) }));
};
exports.default = (0, react_1.memo)(PlainTextInputElement);
//# sourceMappingURL=PlainTextInputElement.js.map