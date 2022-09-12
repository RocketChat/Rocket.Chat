let _jsx,_Fragment,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},Fragment(v){_Fragment=v},jsxs(v){_jsxs=v}},0);let AnimatedVisibility,PositionAnimated,Tooltip;module.link('@rocket.chat/fuselage',{AnimatedVisibility(v){AnimatedVisibility=v},PositionAnimated(v){PositionAnimated=v},Tooltip(v){Tooltip=v}},1);let useDebouncedState,useUniqueId;module.link('@rocket.chat/fuselage-hooks',{useDebouncedState(v){useDebouncedState=v},useUniqueId(v){useUniqueId=v}},2);let cloneElement,forwardRef,useCallback,useMemo,useRef;module.link('react',{cloneElement(v){cloneElement=v},forwardRef(v){forwardRef=v},useCallback(v){useCallback=v},useMemo(v){useMemo=v},useRef(v){useRef=v}},3);var __assign = (this && this.__assign) || function () {
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




var getAnchor = function (children, params) {
    if (typeof children === 'function') {
        return children(params);
    }
    return cloneElement(children, {
        'ref': params.ref,
        'onMouseEnter': function () { return params.toggle(true); },
        'onMouseLeave': function () { return params.toggle(false); },
        'onFocus': function () { return params.toggle(true); },
        'onBlur': function () { return params.toggle(false); },
        'aria-describedby': params.id,
    });
};
// Workaround to the c̶r̶a̶p̶p̶y̶ not-so-great API of PositionAnimated
var InnerTooltip = forwardRef(function InnerTooltip(_a, ref) {
    var style = _a.style, props = __rest(_a, ["style"]);
    return (_jsx("div", __assign({ ref: ref, style: style }, { children: _jsx(Tooltip, __assign({}, props), void 0) }), void 0));
});
var TooltipWrapper = function (_a) {
    var children = _a.children, text = _a.text;
    var anchorRef = useRef(null);
    var _b = useDebouncedState(false, 460), open = _b[0], setOpen = _b[1];
    var toggle = useCallback(function (open) {
        setOpen(open);
        if (open) {
            setOpen.flush();
        }
    }, [setOpen]);
    var id = useUniqueId();
    var anchorParams = useMemo(function () { return ({ ref: anchorRef, toggle: toggle, id: id }); }, [id, toggle]);
    var anchor = getAnchor(children, anchorParams);
    return (_jsxs(_Fragment, { children: [anchor, open && (_jsx(PositionAnimated, __assign({ anchor: anchorRef, placement: 'top-middle', margin: 8, visible: AnimatedVisibility.UNHIDING }, { children: _jsx(InnerTooltip, __assign({ id: id, "aria-hidden": 'false', onMouseEnter: function () { return setOpen(true); }, onMouseLeave: function () { return setOpen(false); } }, { children: text }), void 0) }), void 0))] }, void 0));
};
module.exportDefault(TooltipWrapper);
//# sourceMappingURL=TooltipWrapper.js.map