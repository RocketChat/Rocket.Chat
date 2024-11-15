var _jsx,_jsxs;module.link("react/jsx-runtime",{jsx:function(v){_jsx=v},jsxs:function(v){_jsxs=v}},0);var Box,Icon;module.link('@rocket.chat/fuselage',{Box:function(v){Box=v},Icon:function(v){Icon=v}},1);var useMemo;module.link('react',{useMemo:function(v){useMemo=v}},2);var useTranslation;module.link('react-i18next',{useTranslation:function(v){useTranslation=v}},3);var Actions,CallContactId;module.link('../..',{VoipActions:function(v){Actions=v},VoipContactId:function(v){CallContactId=v}},4);var useVoipContactId;module.link('../../../hooks/useVoipContactId',{useVoipContactId:function(v){useVoipContactId=v}},5);var Container;module.link('../components/VoipPopupContainer',{default:function(v){Container=v}},6);var Content;module.link('../components/VoipPopupContent',{default:function(v){Content=v}},7);var Footer;module.link('../components/VoipPopupFooter',{default:function(v){Footer=v}},8);var Header;module.link('../components/VoipPopupHeader',{default:function(v){Header=v}},9);









const VoipErrorView = ({ session, position }) => {
    const { t } = useTranslation();
    const contactData = useVoipContactId({ session });
    const { status } = session.error;
    const title = useMemo(() => {
        switch (status) {
            case 487:
                return t('Call_terminated');
            case 486:
                return t('Caller_is_busy');
            case 480:
                return t('Temporarily_unavailable');
            default:
                return t('Unable_to_complete_call');
        }
    }, [status, t]);
    return (_jsxs(Container, { "data-testid": 'vc-popup-error', position: position, children: [_jsx(Header, { hideSettings: true, children: _jsxs(Box, { fontScale: 'p2', color: 'danger', fontWeight: 700, children: [_jsx(Icon, { name: 'warning', size: 16 }), " ", title] }) }), _jsx(Content, { children: _jsx(CallContactId, Object.assign({}, contactData)) }), _jsx(Footer, { children: _jsx(Actions, { onEndCall: session.end }) })] }));
};
module.exportDefault(VoipErrorView);
//# sourceMappingURL=VoipErrorView.js.map