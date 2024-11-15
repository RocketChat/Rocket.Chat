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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var jsx_runtime_1 = require("react/jsx-runtime");
var fuselage_1 = require("@rocket.chat/fuselage");
var fuselage_hooks_1 = require("@rocket.chat/fuselage-hooks");
var react_1 = require("react");
var getAnchor = function (children, params) {
    if (typeof children === 'function') {
        return children(params);
    }
    return (0, react_1.cloneElement)(children, {
        'ref': params.ref,
        'onMouseEnter': function () { return params.toggle(true); },
        'onMouseLeave': function () { return params.toggle(false); },
        'onFocus': function () { return params.toggle(true); },
        'onBlur': function () { return params.toggle(false); },
        'aria-describedby': params.id,
    });
};
// Workaround to the c̶r̶a̶p̶p̶y̶ not-so-great API of PositionAnimated
var InnerTooltip = (0, react_1.forwardRef)(function InnerTooltip(_a, ref) {
    var style = _a.style, props = __rest(_a, ["style"]);
    return ((0, jsx_runtime_1.jsx)("div", __assign({ ref: ref, style: style }, { children: (0, jsx_runtime_1.jsx)(fuselage_1.Tooltip, __assign({}, props)) })));
});
var TooltipWrapper = function (_a) {
    var children = _a.children, text = _a.text;
    var anchorRef = (0, react_1.useRef)(null);
    var _b = (0, fuselage_hooks_1.useDebouncedState)(false, 460), open = _b[0], setOpen = _b[1];
    var toggle = (0, react_1.useCallback)(function (open) {
        setOpen(open);
        if (open) {
            setOpen.flush();
        }
    }, [setOpen]);
    var id = (0, fuselage_hooks_1.useUniqueId)();
    var anchorParams = (0, react_1.useMemo)(function () { return ({ ref: anchorRef, toggle: toggle, id: id }); }, [id, toggle]);
    var anchor = getAnchor(children, anchorParams);
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [anchor, open && ((0, jsx_runtime_1.jsx)(fuselage_1.PositionAnimated, __assign({ anchor: anchorRef, placement: 'top-middle', margin: 8, visible: fuselage_1.AnimatedVisibility.UNHIDING }, { children: (0, jsx_runtime_1.jsx)(InnerTooltip, __assign({ id: id, "aria-hidden": 'false', onMouseEnter: function () { return setOpen(true); }, onMouseLeave: function () { return setOpen(false); } }, { children: text })) })))] }));
};
exports.default = TooltipWrapper;
//# sourceMappingURL=TooltipWrapper.js.map