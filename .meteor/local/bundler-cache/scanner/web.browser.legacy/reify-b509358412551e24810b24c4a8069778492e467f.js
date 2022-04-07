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
var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.attachClassName = void 0;
var css_in_js_1 = require("@rocket.chat/css-in-js");
var react_1 = require("react");
var attachClassName = function (props, additionalClassName) { return (__assign(__assign({}, props), { className: props.className
        ? props.className + " " + additionalClassName
        : additionalClassName })); };
exports.attachClassName = attachClassName;
var styled = function (type, filter) {
    return function (slices) {
        var _a, _b;
        var values = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            values[_i - 1] = arguments[_i];
        }
        var cssFn = css_in_js_1.css.apply(void 0, __spreadArray([slices], values));
        var fn = typeof window === 'undefined'
            ? (_a = {},
                _a[type] = function (props, ref) {
                    var content = cssFn(props);
                    var computedClassName = css_in_js_1.createClassName(content);
                    var escapedClassName = css_in_js_1.escapeName(computedClassName);
                    var transpiledContent = css_in_js_1.transpile("." + escapedClassName, content);
                    var newProps = exports.attachClassName(__assign({ ref: ref }, props), computedClassName);
                    return react_1.createElement(react_1.Fragment, {}, react_1.createElement('style', {}, transpiledContent), react_1.createElement(type, filter ? filter(newProps) : newProps));
                },
                _a) : (_b = {},
            _b[type] = function (props, ref) {
                var content = cssFn(props);
                var computedClassName = css_in_js_1.createClassName(content);
                react_1.useDebugValue(computedClassName);
                react_1.useLayoutEffect(function () {
                    var escapedClassName = css_in_js_1.escapeName(computedClassName);
                    var transpiledContent = css_in_js_1.transpile("." + escapedClassName, content);
                    var detach = css_in_js_1.attachRules(transpiledContent);
                    return function () {
                        setTimeout(detach, 1000);
                    };
                }, [computedClassName, content]);
                var newProps = exports.attachClassName(__assign({ ref: ref }, props), computedClassName);
                return react_1.createElement(type, filter ? filter(newProps) : newProps);
            },
            _b);
        var component = react_1.forwardRef(fn[type]);
        component.displayName = "StyledComponent(" + type + ")";
        return component;
    };
};
exports.default = styled;
//# sourceMappingURL=styled.js.map