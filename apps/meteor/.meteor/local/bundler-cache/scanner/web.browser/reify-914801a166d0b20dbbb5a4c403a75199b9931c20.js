module.export({useVoipState:()=>useVoipState},true);let useContext,useMemo;module.link('react',{useContext(v){useContext=v},useMemo(v){useMemo=v}},0);let VoipContext;module.link('../contexts/VoipContext',{VoipContext(v){VoipContext=v}},1);let useVoipEffect;module.link('./useVoipEffect',{useVoipEffect(v){useVoipEffect=v}},2);


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