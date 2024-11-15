module.export({LoginPoweredBy:function(){return LoginPoweredBy}},true);var _jsx,_jsxs;module.link("react/jsx-runtime",{jsx:function(v){_jsx=v},jsxs:function(v){_jsxs=v}},0);var Box;module.link('@rocket.chat/fuselage',{Box:function(v){Box=v}},1);var Link;module.link('@rocket.chat/layout',{Link:function(v){Link=v}},2);var useSetting;module.link('@rocket.chat/ui-contexts',{useSetting:function(v){useSetting=v}},3);var Trans;module.link('react-i18next',{Trans:function(v){Trans=v}},4);




const LoginPoweredBy = () => {
    const hidePoweredBy = useSetting('Layout_Login_Hide_Powered_By');
    if (hidePoweredBy) {
        return null;
    }
    return (_jsx(Box, { mbe: 18, children: _jsxs(Trans, { i18nKey: 'registration.page.poweredBy', children: ['Powered by ', _jsx(Link, { href: 'https://rocket.chat/', target: '_blank', rel: 'noopener noreferrer', children: "Rocket.Chat" })] }) }));
};
module.exportDefault(LoginPoweredBy);
//# sourceMappingURL=LoginPoweredBy.js.map