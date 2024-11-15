module.export({PasswordVerifier:()=>PasswordVerifier},true);let _jsx,_jsxs,_Fragment;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v},Fragment(v){_Fragment=v}},0);let Box;module.link('@rocket.chat/fuselage',{Box(v){Box=v}},1);let useUniqueId;module.link('@rocket.chat/fuselage-hooks',{useUniqueId(v){useUniqueId=v}},2);let useVerifyPassword;module.link('@rocket.chat/ui-contexts',{useVerifyPassword(v){useVerifyPassword=v}},3);let useTranslation;module.link('react-i18next',{useTranslation(v){useTranslation=v}},4);let PasswordVerifierItem;module.link('./PasswordVerifierItem',{PasswordVerifierItem(v){PasswordVerifierItem=v}},5);





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