module.export({isRuleSet:()=>isRuleSet,isDeclaration:()=>isDeclaration,attachDeclaration:()=>attachDeclaration});let DECLARATION,node,RULESET;module.link('stylis',{DECLARATION(v){DECLARATION=v},node(v){node=v},RULESET(v){RULESET=v}},0);
var isRuleSet = function (element) {
    return element.type === RULESET;
};
var isDeclaration = function (element) {
    return element.type === DECLARATION;
};
var attachDeclaration = function (property, value, ruleSet) {
    var declaration = node(property + ":" + value + ";", ruleSet, ruleSet, DECLARATION, property, value, property.length);
    ruleSet.children.push(declaration);
};
//# sourceMappingURL=elements.js.map