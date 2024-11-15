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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.attachClassName = void 0;
var css_in_js_1 = require("@rocket.chat/css-in-js");
var react_1 = require("react");
var attachClassName = function (props, additionalClassName) { return (__assign(__assign({}, props), { className: props.className
        ? "".concat(props.className, " ").concat(additionalClassName)
        : additionalClassName })); };
exports.attachClassName = attachClassName;
var styled = function (type, filter) {
    return function (slices) {
        var _a, _b;
        var values = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            values[_i - 1] = arguments[_i];
        }
        var cssFn = css_in_js_1.css.apply(void 0, __spreadArray([slices], values, false));
        var fn = typeof window === 'undefined'
            ? (_a = {},
                _a[type] = function (props, ref) {
                    var content = cssFn(props);
                    var computedClassName = (0, css_in_js_1.createClassName)(content);
                    var escapedClassName = (0, css_in_js_1.escapeName)(computedClassName);
                    var transpiledContent = (0, css_in_js_1.transpile)(".".concat(escapedClassName), content);
                    var newProps = (0, exports.attachClassName)(__assign({ ref: ref }, props), computedClassName);
                    return (0, react_1.createElement)(react_1.Fragment, {}, (0, react_1.createElement)('style', {}, transpiledContent), (0, react_1.createElement)(type, filter ? filter(newProps) : newProps));
                },
                _a) : (_b = {},
            _b[type] = function (props, ref) {
                var content = cssFn(props);
                var computedClassName = (0, css_in_js_1.createClassName)(content);
                (0, react_1.useDebugValue)(computedClassName);
                (0, react_1.useLayoutEffect)(function () {
                    var escapedClassName = (0, css_in_js_1.escapeName)(computedClassName);
                    var transpiledContent = (0, css_in_js_1.transpile)(".".concat(escapedClassName), content);
                    var detach = (0, css_in_js_1.attachRules)(transpiledContent);
                    return function () {
                        setTimeout(detach, 1000);
                    };
                }, [computedClassName, content]);
                var newProps = (0, exports.attachClassName)(__assign({ ref: ref }, props), computedClassName);
                return (0, react_1.createElement)(type, filter ? filter(newProps) : newProps);
            },
            _b);
        var component = (0, react_1.forwardRef)(fn[type]);
        component.displayName = "StyledComponent(".concat(type, ")");
        return component;
    };
};
exports.default = styled;
//# sourceMappingURL=styled.js.map