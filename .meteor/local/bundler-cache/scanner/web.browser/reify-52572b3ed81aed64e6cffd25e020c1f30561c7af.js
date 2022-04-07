module.export({attachClassName:()=>attachClassName});let attachRules,createClassName,css,escapeName,transpile;module.link('@rocket.chat/css-in-js',{attachRules(v){attachRules=v},createClassName(v){createClassName=v},css(v){css=v},escapeName(v){escapeName=v},transpile(v){transpile=v}},0);let createElement,forwardRef,Fragment,useDebugValue,useLayoutEffect;module.link('react',{createElement(v){createElement=v},forwardRef(v){forwardRef=v},Fragment(v){Fragment=v},useDebugValue(v){useDebugValue=v},useLayoutEffect(v){useLayoutEffect=v}},1);var __assign = (this && this.__assign) || function () {
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


var attachClassName = function (props, additionalClassName) { return (__assign(__assign({}, props), { className: props.className
        ? props.className + " " + additionalClassName
        : additionalClassName })); };
var styled = function (type, filter) {
    return function (slices) {
        var _a, _b;
        var values = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            values[_i - 1] = arguments[_i];
        }
        var cssFn = css.apply(void 0, __spreadArray([slices], values));
        var fn = typeof window === 'undefined'
            ? (_a = {},
                _a[type] = function (props, ref) {
                    var content = cssFn(props);
                    var computedClassName = createClassName(content);
                    var escapedClassName = escapeName(computedClassName);
                    var transpiledContent = transpile("." + escapedClassName, content);
                    var newProps = attachClassName(__assign({ ref: ref }, props), computedClassName);
                    return createElement(Fragment, {}, createElement('style', {}, transpiledContent), createElement(type, filter ? filter(newProps) : newProps));
                },
                _a) : (_b = {},
            _b[type] = function (props, ref) {
                var content = cssFn(props);
                var computedClassName = createClassName(content);
                useDebugValue(computedClassName);
                useLayoutEffect(function () {
                    var escapedClassName = escapeName(computedClassName);
                    var transpiledContent = transpile("." + escapedClassName, content);
                    var detach = attachRules(transpiledContent);
                    return function () {
                        setTimeout(detach, 1000);
                    };
                }, [computedClassName, content]);
                var newProps = attachClassName(__assign({ ref: ref }, props), computedClassName);
                return createElement(type, filter ? filter(newProps) : newProps);
            },
            _b);
        var component = forwardRef(fn[type]);
        component.displayName = "StyledComponent(" + type + ")";
        return component;
    };
};
module.exportDefault(styled);
//# sourceMappingURL=styled.js.map