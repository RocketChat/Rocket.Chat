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
var OverflowElement = function (_a) {
    var block = _a.block, context = _a.context, surfaceRenderer = _a.surfaceRenderer;
    var _b = useUiKitState_1.useUiKitState(block, context), loading = _b[0].loading, action = _b[1];
    var fireChange = react_1.useCallback(function (_a) {
        var value = _a[0];
        return action({ target: { value: value } });
    }, [action]);
    var options = react_1.useMemo(function () {
        return block.options.map(function (_a, i) {
            var _b;
            var value = _a.value, text = _a.text, url = _a.url;
            return [
                value,
                (_b = fromTextObjectToString_1.fromTextObjectToString(surfaceRenderer, text, i)) !== null && _b !== void 0 ? _b : '',
                undefined,
                undefined,
                url,
            ];
        });
    }, [block.options, surfaceRenderer]);
    var _c = fuselage_1.useCursor(-1, options, function (selectedOption, _a) {
        var hide = _a[1];
        fireChange([selectedOption[0], selectedOption[1]]);
        reset();
        hide();
    }), cursor = _c[0], handleKeyDown = _c[1], handleKeyUp = _c[2], reset = _c[3], _d = _c[4], visible = _d[0], hide = _d[1], show = _d[2];
    var ref = react_1.useRef(null);
    var onClick = react_1.useCallback(function () {
        var _a;
        (_a = ref.current) === null || _a === void 0 ? void 0 : _a.focus();
        show();
    }, [show]);
    var handleSelection = react_1.useCallback(function (_a) {
        var value = _a[0], _label = _a[1], _selected = _a[2], _type = _a[3], url = _a[4];
        if (url) {
            window.open(url);
        }
        action({ target: { value: String(value) } });
        reset();
        hide();
    }, [action, hide, reset]);
    return (react_1.default.createElement(react_1.default.Fragment, null,
        react_1.default.createElement(fuselage_1.IconButton, { ref: ref, small: true, onClick: onClick, onBlur: hide, onKeyUp: handleKeyUp, onKeyDown: handleKeyDown, disabled: loading, icon: 'kebab' }),
        react_1.default.createElement(fuselage_1.PositionAnimated, { width: 'auto', visible: visible, anchor: ref, placement: 'bottom-start' },
            react_1.default.createElement(fuselage_1.Options, { onSelect: handleSelection, options: options, cursor: cursor }))));
};
exports.default = OverflowElement;
//# sourceMappingURL=OverflowElement.js.map