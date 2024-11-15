module.export({RegisterFormDisabled:function(){return RegisterFormDisabled}},true);var _jsx,_jsxs;module.link("react/jsx-runtime",{jsx:function(v){_jsx=v},jsxs:function(v){_jsxs=v}},0);var Callout;module.link('@rocket.chat/fuselage',{Callout:function(v){Callout=v}},1);var Form,ActionLink;module.link('@rocket.chat/layout',{Form:function(v){Form=v},ActionLink:function(v){ActionLink=v}},2);var useSetting;module.link('@rocket.chat/ui-contexts',{useSetting:function(v){useSetting=v}},3);var Trans,useTranslation;module.link('react-i18next',{Trans:function(v){Trans=v},useTranslation:function(v){useTranslation=v}},4);




const RegisterFormDisabled = ({ setLoginRoute }) => {
    const linkReplacementText = String(useSetting('Accounts_RegistrationForm_LinkReplacementText'));
    const { t } = useTranslation();
    return (_jsxs(Form, { children: [_jsx(Form.Header, { children: _jsx(Form.Title, { children: t('registration.component.form.register') }) }), _jsx(Form.Container, { children: _jsx(Callout, { role: 'status', type: 'warning', children: linkReplacementText }) }), _jsx(Form.Footer, { children: _jsx(ActionLink, { onClick: () => {
                        setLoginRoute('login');
                    }, children: _jsx(Trans, { i18nKey: 'registration.page.register.back', children: "Back to Login" }) }) })] }));
};
module.exportDefault(RegisterFormDisabled);
//# sourceMappingURL=RegisterFormDisabled.js.map