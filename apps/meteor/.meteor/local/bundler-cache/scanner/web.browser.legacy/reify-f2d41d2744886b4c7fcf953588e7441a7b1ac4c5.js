module.export({PasswordVerifier:function(){return PasswordVerifier}},true);var _jsx,_jsxs,_Fragment;module.link("react/jsx-runtime",{jsx:function(v){_jsx=v},jsxs:function(v){_jsxs=v},Fragment:function(v){_Fragment=v}},0);var Box;module.link('@rocket.chat/fuselage',{Box:function(v){Box=v}},1);var useUniqueId;module.link('@rocket.chat/fuselage-hooks',{useUniqueId:function(v){useUniqueId=v}},2);var useVerifyPassword;module.link('@rocket.chat/ui-contexts',{useVerifyPassword:function(v){useVerifyPassword=v}},3);var useTranslation;module.link('react-i18next',{useTranslation:function(v){useTranslation=v}},4);var PasswordVerifierItem;module.link('./PasswordVerifierItem',{PasswordVerifierItem:function(v){PasswordVerifierItem=v}},5);





const PasswordVerifier = ({ password, id, vertical }) => {
    const { t } = useTranslation();
    const uniqueId = useUniqueId();
    const passwordVerifications = useVerifyPassword(password || '');
    if (!(passwordVerifications === null || passwordVerifications === void 0 ? void 0 : passwordVerifications.length)) {
        return null;
    }
    return (_jsxs(_Fragment, { children: [_jsx("span", { id: id, hidden: true, children: t('Password_Policy_Aria_Description') }), _jsxs(Box, { display: 'flex', flexDirection: 'column', mbs: 8, children: [_jsx(Box, { mbe: 8, fontScale: 'c2', id: uniqueId, "aria-hidden": true, children: t('Password_must_have') }), _jsx(Box, { display: 'flex', flexWrap: 'wrap', role: 'list', "aria-labelledby": uniqueId, children: passwordVerifications.map(({ isValid, limit, name }) => (_jsx(PasswordVerifierItem, { text: t(`${name}-label`, { limit }), isValid: isValid, "aria-invalid": !isValid, vertical: !!vertical }, name))) })] })] }));
};
//# sourceMappingURL=PasswordVerifier.js.map