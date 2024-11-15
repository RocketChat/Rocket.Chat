var _jsx,_jsxs;module.link("react/jsx-runtime",{jsx:function(v){_jsx=v},jsxs:function(v){_jsxs=v}},0);var Button,ButtonGroup;module.link('@rocket.chat/fuselage',{Button:function(v){Button=v},ButtonGroup:function(v){ButtonGroup=v}},1);var Form;module.link('@rocket.chat/layout',{Form:function(v){Form=v}},2);var useDocumentTitle;module.link('@rocket.chat/ui-client',{useDocumentTitle:function(v){useDocumentTitle=v}},3);var useTranslation;module.link('react-i18next',{useTranslation:function(v){useTranslation=v}},4);




const GuestForm = ({ setLoginRoute }) => {
    const { t } = useTranslation();
    useDocumentTitle(t('registration.component.login'), false);
    return (_jsxs(Form, { children: [_jsx(Form.Header, { children: _jsx(Form.Title, { children: t('registration.page.guest.chooseHowToJoin') }) }), _jsx(Form.Container, { children: _jsxs(ButtonGroup, { large: true, stretch: true, vertical: true, children: [_jsx(Button, { primary: true, onClick: () => setLoginRoute('login'), children: t('registration.page.guest.loginWithRocketChat') }), _jsx(Button, { onClick: () => setLoginRoute('anonymous'), children: t('registration.page.guest.continueAsGuest') })] }) })] }));
};
module.exportDefault(GuestForm);
//# sourceMappingURL=GuestForm.js.map