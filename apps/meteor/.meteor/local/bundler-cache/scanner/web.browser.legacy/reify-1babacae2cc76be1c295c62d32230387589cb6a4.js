module.export({RegisterTitle:function(){return RegisterTitle}},true);var _jsxs,_jsx;module.link("react/jsx-runtime",{jsxs:function(v){_jsxs=v},jsx:function(v){_jsx=v}},0);var useSetting;module.link('@rocket.chat/ui-contexts',{useSetting:function(v){useSetting=v}},1);var Trans;module.link('react-i18next',{Trans:function(v){Trans=v}},2);


const RegisterTitle = () => {
    const siteName = useSetting('Site_Name');
    const hideTitle = useSetting('Layout_Login_Hide_Title');
    if (hideTitle) {
        return null;
    }
    return (_jsx("span", { id: 'welcomeTitle', children: _jsxs(Trans, { i18nKey: 'registration.component.welcome', children: ["Welcome to ", siteName, " workspace"] }) }));
};
//# sourceMappingURL=RegisterTitle.js.map