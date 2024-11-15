let _jsx,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v}},0);let useTranslation;module.link('react-i18next',{useTranslation(v){useTranslation=v}},1);let Actions,CallContactId;module.link('../..',{VoipActions(v){Actions=v},VoipContactId(v){CallContactId=v}},2);let useVoipContactId;module.link('../../../hooks/useVoipContactId',{useVoipContactId(v){useVoipContactId=v}},3);let Container;module.link('../components/VoipPopupContainer',{default(v){Container=v}},4);let Content;module.link('../components/VoipPopupContent',{default(v){Content=v}},5);let Footer;module.link('../components/VoipPopupFooter',{default(v){Footer=v}},6);let Header;module.link('../components/VoipPopupHeader',{default(v){Header=v}},7);







const VoipIncomingView = ({ session, position }) => {
    const { t } = useTranslation();
    const contactData = useVoipContactId({ session });
    return (_jsxs(Container, { "data-testid": 'vc-popup-incoming', position: position, children: [_jsx(Header, { children: `${session.transferedBy ? t('Incoming_call_transfer') : t('Incoming_call')}...` }), _jsx(Content, { children: _jsx(CallContactId, Object.assign({}, contactData)) }), _jsx(Footer, { children: _jsx(Actions, { onAccept: session.accept, onDecline: session.end }) })] }));
};
module.exportDefault(VoipIncomingView);
//# sourceMappingURL=VoipIncomingView.js.map