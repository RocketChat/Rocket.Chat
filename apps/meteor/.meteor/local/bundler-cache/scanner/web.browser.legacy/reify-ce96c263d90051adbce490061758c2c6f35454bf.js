module.export({isVoipContextReady:function(){return isVoipContextReady},VoipContext:function(){return VoipContext}},true);var createContext;module.link('react',{createContext:function(v){createContext=v}},0);
const isVoipContextReady = (context) => context.isEnabled && context.voipClient !== null;
const VoipContext = createContext({
    isEnabled: false,
    voipClient: null,
});
//# sourceMappingURL=VoipContext.js.map