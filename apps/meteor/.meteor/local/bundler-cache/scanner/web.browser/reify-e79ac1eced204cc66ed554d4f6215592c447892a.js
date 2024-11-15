module.export({LoginPoweredBy:()=>LoginPoweredBy},true);let _jsx,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v}},0);let Box;module.link('@rocket.chat/fuselage',{Box(v){Box=v}},1);let Link;module.link('@rocket.chat/layout',{Link(v){Link=v}},2);let useSetting;module.link('@rocket.chat/ui-contexts',{useSetting(v){useSetting=v}},3);let Trans;module.link('react-i18next',{Trans(v){Trans=v}},4);




const LoginPoweredBy = () => {
    const hidePoweredBy = useSetting('Layout_Login_Hide_Powered_By');
    if (hidePoweredBy) {
        return null;
    }
    return (_jsx(Box, { mbe: 18, children: _jsxs(Trans, { i18nKey: 'registration.page.poweredBy', children: ['Powered by ', _jsx(Link, { href: 'https://rocket.chat/', target: '_blank', rel: 'noopener noreferrer', children: "Rocket.Chat" })] }) }));
};
module.exportDefault(LoginPoweredBy);
//# sourceMappingURL=LoginPoweredBy.js.map