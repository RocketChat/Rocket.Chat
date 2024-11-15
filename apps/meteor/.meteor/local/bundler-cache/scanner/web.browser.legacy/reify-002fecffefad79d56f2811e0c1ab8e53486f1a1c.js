"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const fuselage_1 = require("@rocket.chat/fuselage");
const react_1 = require("react");
const useStringFromTextObject_1 = require("../hooks/useStringFromTextObject");
const useUiKitState_1 = require("../hooks/useUiKitState");
const OverflowElement = ({ block, context, }) => {
    const [{ loading }, action] = (0, useUiKitState_1.useUiKitState)(block, context);
    const fromTextObjectToString = (0, useStringFromTextObject_1.useStringFromTextObject)();
    const fireChange = (0, react_1.useCallback)(([value]) => action({ target: { value } }), [action]);
    const options = (0, react_1.useMemo)(() => block.options.map(({ value, text, url }) => {
        var _a;
        return [
            value,
            (_a = fromTextObjectToString(text)) !== null && _a !== void 0 ? _a : '',
            undefined,
            undefined,
            undefined,
            url,
        ];
    }), [block.options, fromTextObjectToString]);
    const [cursor, handleKeyDown, handleKeyUp, reset, [visible, hide, show]] = (0, fuselage_1.useCursor)(-1, options, (selectedOption, [, hide]) => {
        fireChange([selectedOption[0], selectedOption[1]]);
        reset();
        hide();
    });
    const ref = (0, react_1.useRef)(null);
    const onClick = (0, react_1.useCallback)(() => {
        var _a;
        (_a = ref.current) === null || _a === void 0 ? void 0 : _a.focus();
        show();
    }, [show]);
    const handleSelection = (0, react_1.useCallback)(([value, _label, _selected, _type, url]) => {
        if (url) {
            window.open(url);
        }
        action({ target: { value: String(value) } });
        reset();
        hide();
    }, [action, hide, reset]);
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(fuselage_1.IconButton, { ref: ref, small: true, onClick: onClick, onBlur: hide, onKeyUp: handleKeyUp, onKeyDown: handleKeyDown, disabled: loading, icon: 'kebab' }), (0, jsx_runtime_1.jsx)(fuselage_1.PositionAnimated, { width: 'auto', visible: visible, anchor: ref, placement: 'bottom-start', children: (0, jsx_runtime_1.jsx)(fuselage_1.Options, { onSelect: handleSelection, options: options, cursor: cursor }) })] }));
};
exports.default = OverflowElement;
//# sourceMappingURL=OverflowElement.js.map