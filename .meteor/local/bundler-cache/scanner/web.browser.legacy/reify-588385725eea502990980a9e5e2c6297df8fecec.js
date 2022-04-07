"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.attachDeclaration = exports.isDeclaration = exports.isRuleSet = void 0;
var stylis_1 = require("stylis");
var isRuleSet = function (element) {
    return element.type === stylis_1.RULESET;
};
exports.isRuleSet = isRuleSet;
var isDeclaration = function (element) {
    return element.type === stylis_1.DECLARATION;
};
exports.isDeclaration = isDeclaration;
var attachDeclaration = function (property, value, ruleSet) {
    var declaration = stylis_1.node(property + ":" + value + ";", ruleSet, ruleSet, stylis_1.DECLARATION, property, value, property.length);
    ruleSet.children.push(declaration);
};
exports.attachDeclaration = attachDeclaration;
//# sourceMappingURL=elements.js.map