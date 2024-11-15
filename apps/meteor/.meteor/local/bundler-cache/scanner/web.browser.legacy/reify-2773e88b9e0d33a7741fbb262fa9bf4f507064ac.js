var _jsx,_jsxs;module.link("react/jsx-runtime",{jsx:function(v){_jsx=v},jsxs:function(v){_jsxs=v}},0);var Box;module.link('@rocket.chat/fuselage',{Box:function(v){Box=v}},1);var useTranslation;module.link('react-i18next',{useTranslation:function(v){useTranslation=v}},2);


const VoipStatus = ({ isHeld = false, isMuted = false }) => {
    const { t } = useTranslation();
    if (!isHeld && !isMuted) {
        return null;
    }
    return (_jsxs(Box, { fontScale: 'p2', display: 'flex', justifyContent: 'space-between', paddingInline: 12, pb: 4, children: [isHeld && (_jsx(Box, { is: 'span', color: 'default', children: t('On_Hold') })), isMuted && (_jsx(Box, { is: 'span', color: 'status-font-on-warning', children: t('Muted') }))] }));
};
module.exportDefault(VoipStatus);
//# sourceMappingURL=VoipStatus.js.map