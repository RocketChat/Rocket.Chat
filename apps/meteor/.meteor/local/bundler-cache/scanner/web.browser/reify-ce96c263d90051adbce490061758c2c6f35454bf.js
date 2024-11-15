module.export({isVoipContextReady:()=>isVoipContextReady,VoipContext:()=>VoipContext},true);let createContext;module.link('react',{createContext(v){createContext=v}},0);
const isVoipContextReady = (context) => context.isEnabled && context.voipClient !== null;
const VoipContext = createContext({
    isEnabled: false,
    voipClient: null,
});
//# sourceMappingURL=VoipContext.js.map