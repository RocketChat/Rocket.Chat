let _jsx;module.link("react/jsx-runtime",{jsx(v){_jsx=v}},0);let BackgroundLayer;module.link('../../common/BackgroundLayer',{default(v){BackgroundLayer=v}},1);let FormPageLayout;module.link('../../common/FormPageLayout',{default(v){FormPageLayout=v}},2);let AdminInfoForm;module.link('../../forms/AdminInfoForm',{default(v){AdminInfoForm=v}},3);var __assign = (this && this.__assign) || function () {
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




var pageLayoutStyleProps = {
    justifyContent: 'center',
};
var AdminInfoPage = function (_a) {
    var title = _a.title, description = _a.description, props = __rest(_a, ["title", "description"]);
    return (_jsx(BackgroundLayer, { children: _jsx(FormPageLayout, __assign({ title: title, styleProps: pageLayoutStyleProps, description: description }, { children: _jsx(AdminInfoForm, __assign({}, props), void 0) }), void 0) }, void 0));
};
module.exportDefault(AdminInfoPage);
//# sourceMappingURL=AdminInfoPage.js.map