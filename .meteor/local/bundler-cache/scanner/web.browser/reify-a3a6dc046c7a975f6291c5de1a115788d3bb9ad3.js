module.export({escapeRegExp:()=>escapeRegExp});var toString = function (object) { return (object ? "" + object : ''); };
var escapeRegExp = function (input) {
    return toString(input).replace(/[-.*+?^=!:${}()|[\]\/\\]/g, '\\$&');
};
//# sourceMappingURL=escapeRegExp.js.map