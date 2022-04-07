module.export({createLogicalPropertiesMiddleware:()=>createLogicalPropertiesMiddleware});let cssSupports;module.link('@rocket.chat/css-supports',{cssSupports(v){cssSupports=v}},0);let node,RULESET,serialize;module.link('stylis',{node(v){node=v},RULESET(v){RULESET=v},serialize(v){serialize=v}},1);let attachDeclaration,isDeclaration,isRuleSet;module.link('./elements',{attachDeclaration(v){attachDeclaration=v},isDeclaration(v){isDeclaration=v},isRuleSet(v){isRuleSet=v}},2);let compileOperations;module.link('./operations',{compileOperations(v){compileOperations=v}},3);



var createLogicalPropertiesMiddleware = function (_a) {
    var _b = _a === void 0 ? {} : _a, _c = _b.isPropertySupported, isPropertySupported = _c === void 0 ? function (property) {
        return cssSupports(property + ":inherit");
    } : _c, _d = _b.isPropertyValueSupported, isPropertyValueSupported = _d === void 0 ? function (property, value) {
        return cssSupports(property + ":" + value);
    } : _d;
    var ops = compileOperations({
        isPropertySupported: isPropertySupported,
        isPropertyValueSupported: isPropertyValueSupported,
    });
    return function (ruleSet, _, __, callback) {
        if (!isRuleSet(ruleSet) || ruleSet.root !== null) {
            return undefined;
        }
        var ltrRuleSet = node(ruleSet.props
            .map(function (selector) { return "html:not([dir=rtl]) " + selector; })
            .join(','), undefined, undefined, RULESET, ruleSet.props.map(function (selector) { return "html:not([dir=rtl]) " + selector; }), [], 0);
        var rtlRuleSet = node(ruleSet.props.map(function (selector) { return "[dir=rtl] " + selector; }).join(','), undefined, undefined, RULESET, ruleSet.props.map(function (selector) { return "[dir=rtl] " + selector; }), [], 0);
        var rules = ruleSet.children;
        ruleSet.children = [];
        ruleSet.return = '';
        for (var _i = 0, _a = rules; _i < _a.length; _i++) {
            var rule = _a[_i];
            if (!isDeclaration(rule)) {
                ruleSet.children.push(rule);
                continue;
            }
            var op = ops.get(rule.props);
            if (op) {
                op(rule.children, ruleSet, ltrRuleSet, rtlRuleSet);
                continue;
            }
            attachDeclaration(rule.props, rule.children, ruleSet);
        }
        return serialize([ltrRuleSet, rtlRuleSet], callback);
    };
};
//# sourceMappingURL=middleware.js.map