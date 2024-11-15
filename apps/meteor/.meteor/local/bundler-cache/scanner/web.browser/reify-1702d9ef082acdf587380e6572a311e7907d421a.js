let _jsx,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v}},0);let Box,IconButton;module.link('@rocket.chat/fuselage',{Box(v){Box=v},IconButton(v){IconButton=v}},1);let useTranslation;module.link('react-i18next',{useTranslation(v){useTranslation=v}},2);let VoipSettingsButton;module.link('../../VoipSettingsButton',{default(v){VoipSettingsButton=v}},3);



const VoipPopupHeader = ({ children, hideSettings, onClose }) => {
    const { t } = useTranslation();
    return (_jsxs(Box, { is: 'header', p: 12, pbe: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', children: [children && (_jsx(Box, { is: 'h3', id: 'voipPopupTitle', color: 'titles-labels', fontScale: 'p2', fontWeight: '700', children: children })), !hideSettings && (_jsx(Box, { mis: 8, children: _jsx(VoipSettingsButton, { mini: true }) })), onClose && _jsx(IconButton, { mini: true, mis: 8, "aria-label": t('Close'), icon: 'cross', onClick: onClose })] }));
};
module.exportDefault(VoipPopupHeader);
//# sourceMappingURL=VoipPopupHeader.js.map