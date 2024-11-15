module.export({useVoipState:function(){return useVoipState}},true);var useContext,useMemo;module.link('react',{useContext:function(v){useContext=v},useMemo:function(v){useMemo=v}},0);var VoipContext;module.link('../contexts/VoipContext',{VoipContext:function(v){VoipContext=v}},1);var useVoipEffect;module.link('./useVoipEffect',{useVoipEffect:function(v){useVoipEffect=v}},2);


const DEFAULT_STATE = {
    isRegistered: false,
    isReady: false,
    isInCall: false,
    isOnline: false,
    isIncoming: false,
    isOngoing: false,
    isOutgoing: false,
    isError: false,
};
const useVoipState = () => {
    const { isEnabled, error: clientError } = useContext(VoipContext);
    const callState = useVoipEffect((client) => client.getState(), DEFAULT_STATE);
    return useMemo(() => (Object.assign(Object.assign({}, callState), { clientError,
        isEnabled, isError: !!clientError || callState.isError })), [clientError, isEnabled, callState]);
};
//# sourceMappingURL=useVoipState.js.map