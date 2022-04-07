"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLogicalPropertiesMiddleware = void 0;
var css_supports_1 = require("@rocket.chat/css-supports");
var stylis_1 = require("stylis");
var elements_1 = require("./elements");
var operations_1 = require("./operations");
var createLogicalPropertiesMiddleware = function (_a) {
    var _b = _a === void 0 ? {} : _a, _c = _b.isPropertySupported, isPropertySupported = _c === void 0 ? function (property) {
        return css_supports_1.cssSupports(property + ":inherit");
    } : _c, _d = _b.isPropertyValueSupported, isPropertyValueSupported = _d === void 0 ? function (property, value) {
        return css_supports_1.cssSupports(property + ":" + value);
    } : _d;
    var ops = operations_1.compileOperations({
        isPropertySupported: isPropertySupported,
        isPropertyValueSupported: isPropertyValueSupported,
    });
    return function (ruleSet, _, __, callback) {
        if (!elements_1.isRuleSet(ruleSet) || ruleSet.root !== null) {
            return undefined;
        }
        var ltrRuleSet = stylis_1.node(ruleSet.props
            .map(function (selector) { return "html:not([dir=rtl]) " + selector; })
            .join(','), undefined, undefined, stylis_1.RULESET, ruleSet.props.map(function (selector) { return "html:not([dir=rtl]) " + selector; }), [], 0);
        var rtlRuleSet = stylis_1.node(ruleSet.props.map(function (selector) { return "[dir=rtl] " + selector; }).join(','), undefined, undefined, stylis_1.RULESET, ruleSet.props.map(function (selector) { return "[dir=rtl] " + selector; }), [], 0);
        var rules = ruleSet.children;
        ruleSet.children = [];
        ruleSet.return = '';
        for (var _i = 0, _a = rules; _i < _a.length; _i++) {
            var rule = _a[_i];
            if (!elements_1.isDeclaration(rule)) {
                ruleSet.children.push(rule);
                continue;
            }
            var op = ops.get(rule.props);
            if (op) {
                op(rule.children, ruleSet, ltrRuleSet, rtlRuleSet);
                continue;
            }
            elements_1.attachDeclaration(rule.props, rule.children, ruleSet);
        }
        return stylis_1.serialize([ltrRuleSet, rtlRuleSet], callback);
    };
};
exports.createLogicalPropertiesMiddleware = createLogicalPropertiesMiddleware;
//# sourceMappingURL=middleware.js.map