module.export({RegisterFormDisabled:()=>RegisterFormDisabled},true);let _jsx,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v}},0);let Callout;module.link('@rocket.chat/fuselage',{Callout(v){Callout=v}},1);let Form,ActionLink;module.link('@rocket.chat/layout',{Form(v){Form=v},ActionLink(v){ActionLink=v}},2);let useSetting;module.link('@rocket.chat/ui-contexts',{useSetting(v){useSetting=v}},3);let Trans,useTranslation;module.link('react-i18next',{Trans(v){Trans=v},useTranslation(v){useTranslation=v}},4);




const RegisterFormDisabled = ({ setLoginRoute }) => {
    const linkReplacementText = String(useSetting('Accounts_RegistrationForm_LinkReplacementText'));
    const { t } = useTranslation();
    return (_jsxs(Form, { children: [_jsx(Form.Header, { children: _jsx(Form.Title, { children: t('registration.component.form.register') }) }), _jsx(Form.Container, { children: _jsx(Callout, { role: 'status', type: 'warning', children: linkReplacementText }) }), _jsx(Form.Footer, { children: _jsx(ActionLink, { onClick: () => {
                        setLoginRoute('login');
                    }, children: _jsx(Trans, { i18nKey: 'registration.page.register.back', children: "Back to Login" }) }) })] }));
};
module.exportDefault(RegisterFormDisabled);
//# sourceMappingURL=RegisterFormDisabled.js.map