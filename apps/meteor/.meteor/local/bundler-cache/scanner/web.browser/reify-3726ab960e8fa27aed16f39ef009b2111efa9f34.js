let _jsx;module.link("react/jsx-runtime",{jsx(v){_jsx=v}},0);let BackgroundLayer;module.link('@rocket.chat/layout',{BackgroundLayer(v){BackgroundLayer=v}},1);let FormPageLayout;module.link('../../common/FormPageLayout',{default(v){FormPageLayout=v}},2);let RegisterServerForm;module.link('../../forms/RegisterServerForm',{default(v){RegisterServerForm=v}},3);var __assign = (this && this.__assign) || function () {
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




var pageLayoutStyleProps = {
    justifyContent: 'center',
};
var RegisterServerPage = function (props) { return (_jsx(BackgroundLayer, { children: _jsx(FormPageLayout, __assign({ styleProps: pageLayoutStyleProps }, { children: _jsx(RegisterServerForm, __assign({}, props)) })) })); };
module.exportDefault(RegisterServerPage);
//# sourceMappingURL=RegisterServerPage.js.map