let _jsx,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v}},0);let useState;module.link('react',{useState(v){useState=v}},1);let Actions,CallContactId,Status,DialPad,Timer;module.link('../..',{VoipActions(v){Actions=v},VoipContactId(v){CallContactId=v},VoipStatus(v){Status=v},VoipDialPad(v){DialPad=v},VoipTimer(v){Timer=v}},2);let useVoipContactId;module.link('../../../hooks/useVoipContactId',{useVoipContactId(v){useVoipContactId=v}},3);let useVoipTransferModal;module.link('../../../hooks/useVoipTransferModal',{useVoipTransferModal(v){useVoipTransferModal=v}},4);let Container;module.link('../components/VoipPopupContainer',{default(v){Container=v}},5);let Content;module.link('../components/VoipPopupContent',{default(v){Content=v}},6);let Footer;module.link('../components/VoipPopupFooter',{default(v){Footer=v}},7);let Header;module.link('../components/VoipPopupHeader',{default(v){Header=v}},8);








const VoipOngoingView = ({ session, position }) => {
    const { startTransfer } = useVoipTransferModal({ session });
    const contactData = useVoipContactId({ session, transferEnabled: false });
    const [isDialPadOpen, setDialerOpen] = useState(false);
    const [dtmfValue, setDTMF] = useState('');
    const handleDTMF = (value, digit) => {
        setDTMF(value);
        if (digit) {
            session.dtmf(digit);
        }
    };
    return (_jsxs(Container, { secondary: true, "data-testid": 'vc-popup-ongoing', position: position, children: [_jsx(Header, { children: _jsx(Timer, {}) }), _jsxs(Content, { children: [_jsx(Status, { isMuted: session.isMuted, isHeld: session.isHeld }), _jsx(CallContactId, Object.assign({}, contactData)), isDialPadOpen && _jsx(DialPad, { value: dtmfValue, longPress: false, onChange: handleDTMF })] }), _jsx(Footer, { children: _jsx(Actions, { isMuted: session.isMuted, isHeld: session.isHeld, isDTMFActive: isDialPadOpen, onMute: session.mute, onHold: session.hold, onEndCall: session.end, onTransfer: startTransfer, onDTMF: () => setDialerOpen(!isDialPadOpen) }) })] }));
};
module.exportDefault(VoipOngoingView);
//# sourceMappingURL=VoipOngoingView.js.map