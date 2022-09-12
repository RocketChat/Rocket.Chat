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
var defaultClasses = {
    root: 'rc-scrollbars-container',
    view: 'rc-scrollbars-view',
    trackVertical: 'rc-scrollbars-track rc-scrollbars-track-v',
    trackHorizontal: 'rc-scrollbars-track rc-scrollbars-track-h',
    thumbVertical: 'rc-scrollbars-thumb rc-scrollbars-thumb-v',
    thumbHorizontal: 'rc-scrollbars-thumb rc-scrollbars-thumb-h',
};
function mergeClasses(defaultClasses, providedClasses) {
    return providedClasses
        ? Object.keys(defaultClasses).reduce(function (result, classKey) {
            result[classKey] = "".concat(defaultClasses[classKey], " ").concat(providedClasses[classKey] || '');
            return result;
        }, {})
        : defaultClasses;
}
function getFinalClasses(props) {
    var className = props.className, classes = props.classes;
    var defaultRootClass = defaultClasses.root, rest = __rest(defaultClasses, ["root"]);
    return __assign({ root: [defaultRootClass, className, classes === null || classes === void 0 ? void 0 : classes.root].filter(Boolean).join(' ') }, mergeClasses(rest, props.classes));
}
exports.default = getFinalClasses;
