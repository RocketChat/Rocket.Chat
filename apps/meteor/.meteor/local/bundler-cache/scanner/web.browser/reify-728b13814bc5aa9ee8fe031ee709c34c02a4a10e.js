let _jsx,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v}},0);let Box,Icon;module.link('@rocket.chat/fuselage',{Box(v){Box=v},Icon(v){Icon=v}},1);let useMemo;module.link('react',{useMemo(v){useMemo=v}},2);let useTranslation;module.link('react-i18next',{useTranslation(v){useTranslation=v}},3);let Actions,CallContactId;module.link('../..',{VoipActions(v){Actions=v},VoipContactId(v){CallContactId=v}},4);let useVoipContactId;module.link('../../../hooks/useVoipContactId',{useVoipContactId(v){useVoipContactId=v}},5);let Container;module.link('../components/VoipPopupContainer',{default(v){Container=v}},6);let Content;module.link('../components/VoipPopupContent',{default(v){Content=v}},7);let Footer;module.link('../components/VoipPopupFooter',{default(v){Footer=v}},8);let Header;module.link('../components/VoipPopupHeader',{default(v){Header=v}},9);









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