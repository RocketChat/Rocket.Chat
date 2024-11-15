var _jsx;module.link("react/jsx-runtime",{jsx:function(v){_jsx=v}},0);var isVoipErrorSession,isVoipIncomingSession,isVoipOngoingSession,isVoipOutgoingSession;module.link('../../definitions',{isVoipErrorSession:function(v){isVoipErrorSession=v},isVoipIncomingSession:function(v){isVoipIncomingSession=v},isVoipOngoingSession:function(v){isVoipOngoingSession=v},isVoipOutgoingSession:function(v){isVoipOutgoingSession=v}},1);var useVoipDialer;module.link('../../hooks/useVoipDialer',{useVoipDialer:function(v){useVoipDialer=v}},2);var useVoipSession;module.link('../../hooks/useVoipSession',{useVoipSession:function(v){useVoipSession=v}},3);var DialerView;module.link('./views/VoipDialerView',{default:function(v){DialerView=v}},4);var ErrorView;module.link('./views/VoipErrorView',{default:function(v){ErrorView=v}},5);var IncomingView;module.link('./views/VoipIncomingView',{default:function(v){IncomingView=v}},6);var OngoingView;module.link('./views/VoipOngoingView',{default:function(v){OngoingView=v}},7);var OutgoingView;module.link('./views/VoipOutgoingView',{default:function(v){OutgoingView=v}},8);








const VoipPopup = ({ position }) => {
    const session = useVoipSession();
    const { open: isDialerOpen } = useVoipDialer();
    if (isVoipIncomingSession(session)) {
        return _jsx(IncomingView, { session: session, position: position });
    }
    if (isVoipOngoingSession(session)) {
        return _jsx(OngoingView, { session: session, position: position });
    }
    if (isVoipOutgoingSession(session)) {
        return _jsx(OutgoingView, { session: session, position: position });
    }
    if (isVoipErrorSession(session)) {
        return _jsx(ErrorView, { session: session, position: position });
    }
    if (isDialerOpen) {
        return _jsx(DialerView, { position: position });
    }
    return null;
};
module.exportDefault(VoipPopup);
//# sourceMappingURL=VoipPopup.js.map