let _jsx;module.link("react/jsx-runtime",{jsx(v){_jsx=v}},0);let isVoipErrorSession,isVoipIncomingSession,isVoipOngoingSession,isVoipOutgoingSession;module.link('../../definitions',{isVoipErrorSession(v){isVoipErrorSession=v},isVoipIncomingSession(v){isVoipIncomingSession=v},isVoipOngoingSession(v){isVoipOngoingSession=v},isVoipOutgoingSession(v){isVoipOutgoingSession=v}},1);let useVoipDialer;module.link('../../hooks/useVoipDialer',{useVoipDialer(v){useVoipDialer=v}},2);let useVoipSession;module.link('../../hooks/useVoipSession',{useVoipSession(v){useVoipSession=v}},3);let DialerView;module.link('./views/VoipDialerView',{default(v){DialerView=v}},4);let ErrorView;module.link('./views/VoipErrorView',{default(v){ErrorView=v}},5);let IncomingView;module.link('./views/VoipIncomingView',{default(v){IncomingView=v}},6);let OngoingView;module.link('./views/VoipOngoingView',{default(v){OngoingView=v}},7);let OutgoingView;module.link('./views/VoipOutgoingView',{default(v){OutgoingView=v}},8);








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