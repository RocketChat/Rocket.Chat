let _jsx,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v}},0);let Box;module.link('@rocket.chat/fuselage',{Box(v){Box=v}},1);let useTranslation,Trans;module.link('react-i18next',{useTranslation(v){useTranslation=v},Trans(v){Trans=v}},2);let BackgroundLayer;module.link('../../common/BackgroundLayer',{default(v){BackgroundLayer=v}},3);let FormPageLayout;module.link('../../common/FormPageLayout',{default(v){FormPageLayout=v}},4);let CreateCloudWorkspaceForm;module.link('../../forms/CreateCloudWorkspaceForm',{default(v){CreateCloudWorkspaceForm=v}},5);let Description;module.link('./Description',{default(v){Description=v}},6);let TitleCreateCloudPage;module.link('./TitleCreateCloudPage',{default(v){TitleCreateCloudPage=v}},7);var __assign = (this && this.__assign) || function () {
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








var CreateCloudWorkspacePage = function (props) {
    var t = useTranslation().t;
    return (_jsx(BackgroundLayer, { children: _jsxs(FormPageLayout, __assign({ title: _jsx(TitleCreateCloudPage, {}, void 0), description: _jsx(Description, {}, void 0), subtitle: t('page.createCloudWorkspace.tryGold') }, { children: [_jsx(CreateCloudWorkspaceForm, __assign({}, props), void 0), _jsx(Box, __assign({ mbs: 'x28', display: 'inline', textAlign: 'center' }, { children: _jsxs(Trans, __assign({ i18nKey: 'page.alreadyHaveAccount' }, { children: ["Already have an account?", _jsx(Box, __assign({ is: 'a', color: 'primary-400', textDecorationLine: 'none', href: 'https://cloud.rocket.chat/login', target: '_blank', rel: 'noopener noreferrer' }, { children: "Manage your workspaces." }), void 0)] }), void 0) }), void 0)] }), void 0) }, void 0));
};
module.exportDefault(CreateCloudWorkspacePage);
//# sourceMappingURL=CreateCloudWorkspacePage.js.map