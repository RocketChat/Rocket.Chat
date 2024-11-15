module.export({RegisterTitle:()=>RegisterTitle},true);let _jsxs,_jsx;module.link("react/jsx-runtime",{jsxs(v){_jsxs=v},jsx(v){_jsx=v}},0);let useSetting;module.link('@rocket.chat/ui-contexts',{useSetting(v){useSetting=v}},1);let Trans;module.link('react-i18next',{Trans(v){Trans=v}},2);


const RegisterTitle = () => {
    const siteName = useSetting('Site_Name');
    const hideTitle = useSetting('Layout_Login_Hide_Title');
    if (hideTitle) {
        return null;
    }
    return (_jsx("span", { id: 'welcomeTitle', children: _jsxs(Trans, { i18nKey: 'registration.component.welcome', children: ["Welcome to ", siteName, " workspace"] }) }));
};
//# sourceMappingURL=RegisterTitle.js.map