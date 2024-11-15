var _jsx,_jsxs;module.link("react/jsx-runtime",{jsx:function(v){_jsx=v},jsxs:function(v){_jsxs=v}},0);var useSetting;module.link('@rocket.chat/ui-contexts',{useSetting:function(v){useSetting=v}},1);var HorizontalTemplate;module.link('./template/HorizontalTemplate',{default:function(v){HorizontalTemplate=v}},2);var VerticalTemplate;module.link('./template/VerticalTemplate',{default:function(v){VerticalTemplate=v}},3);var __rest = (this && this.__rest) || function (s, e) {
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




const RegisterTemplate = (_a) => {
    var { children } = _a, props = __rest(_a, ["children"]);
    const template = useSetting('Layout_Login_Template');
    return (_jsxs("main", { children: [template === 'vertical-template' && _jsx(VerticalTemplate, Object.assign({}, props, { children: children })), template === 'horizontal-template' && _jsx(HorizontalTemplate, Object.assign({}, props, { children: children }))] }));
};
module.exportDefault(RegisterTemplate);
//# sourceMappingURL=RegisterTemplate.js.map