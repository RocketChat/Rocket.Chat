var _jsx,_jsxs;module.link("react/jsx-runtime",{jsx:function(v){_jsx=v},jsxs:function(v){_jsxs=v}},0);var useTranslation;module.link('react-i18next',{useTranslation:function(v){useTranslation=v}},1);var Actions,CallContactId;module.link('../..',{VoipActions:function(v){Actions=v},VoipContactId:function(v){CallContactId=v}},2);var useVoipContactId;module.link('../../../hooks/useVoipContactId',{useVoipContactId:function(v){useVoipContactId=v}},3);var Container;module.link('../components/VoipPopupContainer',{default:function(v){Container=v}},4);var Content;module.link('../components/VoipPopupContent',{default:function(v){Content=v}},5);var Footer;module.link('../components/VoipPopupFooter',{default:function(v){Footer=v}},6);var Header;module.link('../components/VoipPopupHeader',{default:function(v){Header=v}},7);







const VoipIncomingView = ({ session, position }) => {
    const { t } = useTranslation();
    const contactData = useVoipContactId({ session });
    return (_jsxs(Container, { "data-testid": 'vc-popup-incoming', position: position, children: [_jsx(Header, { children: `${session.transferedBy ? t('Incoming_call_transfer') : t('Incoming_call')}...` }), _jsx(Content, { children: _jsx(CallContactId, Object.assign({}, contactData)) }), _jsx(Footer, { children: _jsx(Actions, { onAccept: session.accept, onDecline: session.end }) })] }));
};
module.exportDefault(VoipIncomingView);
//# sourceMappingURL=VoipIncomingView.js.map