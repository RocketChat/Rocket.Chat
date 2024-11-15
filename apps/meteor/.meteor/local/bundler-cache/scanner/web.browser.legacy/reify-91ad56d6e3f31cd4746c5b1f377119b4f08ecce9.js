module.export({useVoipSession:function(){return useVoipSession}},true);var useVoipEffect;module.link('./useVoipEffect',{useVoipEffect:function(v){useVoipEffect=v}},0);
const useVoipSession = () => {
    return useVoipEffect((client) => client.getSession(), null);
};
//# sourceMappingURL=useVoipSession.js.map