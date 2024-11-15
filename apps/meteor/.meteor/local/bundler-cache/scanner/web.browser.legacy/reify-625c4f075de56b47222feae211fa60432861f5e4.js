var _jsx,_Fragment,_jsxs;module.link("react/jsx-runtime",{jsx:function(v){_jsx=v},Fragment:function(v){_Fragment=v},jsxs:function(v){_jsxs=v}},0);var ButtonGroup,Divider;module.link('@rocket.chat/fuselage',{ButtonGroup:function(v){ButtonGroup=v},Divider:function(v){Divider=v}},1);var useLoginServices,useSetting;module.link('@rocket.chat/ui-contexts',{useLoginServices:function(v){useLoginServices=v},useSetting:function(v){useSetting=v}},2);var useTranslation;module.link('react-i18next',{useTranslation:function(v){useTranslation=v}},3);var LoginServicesButton;module.link('./LoginServicesButton',{default:function(v){LoginServicesButton=v}},4);




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