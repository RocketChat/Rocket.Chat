module.export({useVoip:()=>useVoip},true);let useContext,useMemo;module.link('react',{useContext(v){useContext=v},useMemo(v){useMemo=v}},0);let VoipContext;module.link('../contexts/VoipContext',{VoipContext(v){VoipContext=v}},1);let useVoipAPI;module.link('./useVoipAPI',{useVoipAPI(v){useVoipAPI=v}},2);let useVoipSession;module.link('./useVoipSession',{useVoipSession(v){useVoipSession=v}},3);let useVoipState;module.link('./useVoipState',{useVoipState(v){useVoipState=v}},4);




const useVoip = () => {
    const { error } = useContext(VoipContext);
    const state = useVoipState();
    const session = useVoipSession();
    const api = useVoipAPI();
    return useMemo(() => (Object.assign(Object.assign(Object.assign({}, state), api), { session,
        error })), [state, api, session, error]);
};
//# sourceMappingURL=useVoip.js.map