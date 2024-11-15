let _jsx,_Fragment,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},Fragment(v){_Fragment=v},jsxs(v){_jsxs=v}},0);let ButtonGroup,Divider;module.link('@rocket.chat/fuselage',{ButtonGroup(v){ButtonGroup=v},Divider(v){Divider=v}},1);let useLoginServices,useSetting;module.link('@rocket.chat/ui-contexts',{useLoginServices(v){useLoginServices=v},useSetting(v){useSetting=v}},2);let useTranslation;module.link('react-i18next',{useTranslation(v){useTranslation=v}},3);let LoginServicesButton;module.link('./LoginServicesButton',{default(v){LoginServicesButton=v}},4);




const LoginServices = ({ disabled, setError, }) => {
    const { t } = useTranslation();
    const services = useLoginServices();
    const showFormLogin = useSetting('Accounts_ShowFormLogin');
    if (services.length === 0) {
        return null;
    }
    return (_jsxs(_Fragment, { children: [showFormLogin && _jsx(Divider, { mb: 24, p: 0, children: t('registration.component.form.divider') }), _jsx(ButtonGroup, { vertical: true, stretch: true, small: true, children: services.map((service) => (_jsx(LoginServicesButton, Object.assign({ disabled: disabled }, service, { setError: setError }), service.service))) })] }));
};
module.exportDefault(LoginServices);
//# sourceMappingURL=LoginServices.js.map