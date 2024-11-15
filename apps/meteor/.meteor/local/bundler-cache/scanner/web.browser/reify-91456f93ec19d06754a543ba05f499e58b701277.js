let _jsx;module.link("react/jsx-runtime",{jsx(v){_jsx=v}},0);let BackgroundLayer;module.link('@rocket.chat/layout',{BackgroundLayer(v){BackgroundLayer=v}},1);let FormPageLayout;module.link('../../common/FormPageLayout',{default(v){FormPageLayout=v}},2);let RegisterOfflineForm;module.link('../../forms/RegisterOfflineForm',{default(v){RegisterOfflineForm=v}},3);var __assign = (this && this.__assign) || function () {
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
var RegisterOfflinePage = function (props) { return (_jsx(BackgroundLayer, { children: _jsx(FormPageLayout, __assign({ styleProps: pageLayoutStyleProps }, { children: _jsx(RegisterOfflineForm, __assign({}, props)) })) })); };
module.exportDefault(RegisterOfflinePage);
//# sourceMappingURL=RegisterOfflinePage.js.map