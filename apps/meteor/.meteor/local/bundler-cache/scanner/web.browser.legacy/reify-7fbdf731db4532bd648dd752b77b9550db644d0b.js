var _jsx,_jsxs;module.link("react/jsx-runtime",{jsx:function(v){_jsx=v},jsxs:function(v){_jsxs=v}},0);var useState;module.link('react',{useState:function(v){useState=v}},1);var Actions,CallContactId,Status,DialPad,Timer;module.link('../..',{VoipActions:function(v){Actions=v},VoipContactId:function(v){CallContactId=v},VoipStatus:function(v){Status=v},VoipDialPad:function(v){DialPad=v},VoipTimer:function(v){Timer=v}},2);var useVoipContactId;module.link('../../../hooks/useVoipContactId',{useVoipContactId:function(v){useVoipContactId=v}},3);var useVoipTransferModal;module.link('../../../hooks/useVoipTransferModal',{useVoipTransferModal:function(v){useVoipTransferModal=v}},4);var Container;module.link('../components/VoipPopupContainer',{default:function(v){Container=v}},5);var Content;module.link('../components/VoipPopupContent',{default:function(v){Content=v}},6);var Footer;module.link('../components/VoipPopupFooter',{default:function(v){Footer=v}},7);var Header;module.link('../components/VoipPopupHeader',{default:function(v){Header=v}},8);








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