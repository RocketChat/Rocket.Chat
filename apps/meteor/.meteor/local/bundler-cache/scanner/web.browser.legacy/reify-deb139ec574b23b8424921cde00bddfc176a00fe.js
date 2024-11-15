module.export({useVoip:function(){return useVoip}},true);var useContext,useMemo;module.link('react',{useContext:function(v){useContext=v},useMemo:function(v){useMemo=v}},0);var VoipContext;module.link('../contexts/VoipContext',{VoipContext:function(v){VoipContext=v}},1);var useVoipAPI;module.link('./useVoipAPI',{useVoipAPI:function(v){useVoipAPI=v}},2);var useVoipSession;module.link('./useVoipSession',{useVoipSession:function(v){useVoipSession=v}},3);var useVoipState;module.link('./useVoipState',{useVoipState:function(v){useVoipState=v}},4);




const useVoip = () => {
    const { error } = useContext(VoipContext);
    const state = useVoipState();
    const session = useVoipSession();
    const api = useVoipAPI();
    return useMemo(() => (Object.assign(Object.assign(Object.assign({}, state), api), { session,
        error })), [state, api, session, error]);
};
//# sourceMappingURL=useVoip.js.map