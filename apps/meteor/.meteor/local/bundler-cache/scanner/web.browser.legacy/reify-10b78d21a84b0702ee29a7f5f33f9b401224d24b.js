module.export({isVoipIncomingSession:function(){return isVoipIncomingSession},isVoipOngoingSession:function(){return isVoipOngoingSession},isVoipOutgoingSession:function(){return isVoipOutgoingSession},isVoipErrorSession:function(){return isVoipErrorSession}},true);const isVoipIncomingSession = (session) => {
    return (session === null || session === void 0 ? void 0 : session.type) === 'INCOMING';
};
const isVoipOngoingSession = (session) => {
    return (session === null || session === void 0 ? void 0 : session.type) === 'ONGOING';
};
const isVoipOutgoingSession = (session) => {
    return (session === null || session === void 0 ? void 0 : session.type) === 'OUTGOING';
};
const isVoipErrorSession = (session) => {
    return (session === null || session === void 0 ? void 0 : session.type) === 'ERROR';
};
//# sourceMappingURL=VoipSession.js.map