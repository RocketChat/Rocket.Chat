"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const fuselage_1 = require("@rocket.chat/fuselage");
const react_1 = require("react");
const useStringFromTextObject_1 = require("../hooks/useStringFromTextObject");
const useUiKitState_1 = require("../hooks/useUiKitState");
const MultiStaticSelectElement = ({ block, context, }) => {
    const [{ loading, value, error }, action] = (0, useUiKitState_1.useUiKitState)(block, context);
    const fromTextObjectToString = (0, useStringFromTextObject_1.useStringFromTextObject)();
    const options = (0, react_1.useMemo)(() => block.options.map(({ value, text }) => {
        var _a;
        return [
            value,
            (_a = fromTextObjectToString(text)) !== null && _a !== void 0 ? _a : '',
        ];
    }), [block.options, fromTextObjectToString]);
    const handleChange = (0, react_1.useCallback)((value) => {
        action({ target: { value } });
    }, [action]);
    return ((0, jsx_runtime_1.jsx)(fuselage_1.MultiSelectFiltered, { value: value, disabled: loading, error: error, options: options, placeholder: fromTextObjectToString(block.placeholder), onChange: handleChange }));
};
exports.default = (0, react_1.memo)(MultiStaticSelectElement);
//# sourceMappingURL=MultiStaticSelectElement.js.map