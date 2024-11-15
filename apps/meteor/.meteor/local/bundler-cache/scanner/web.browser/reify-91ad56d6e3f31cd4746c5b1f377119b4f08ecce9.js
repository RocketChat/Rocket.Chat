module.export({useVoipSession:()=>useVoipSession},true);let useVoipEffect;module.link('./useVoipEffect',{useVoipEffect(v){useVoipEffect=v}},0);
const useVoipSession = () => {
    return useVoipEffect((client) => client.getSession(), null);
};
//# sourceMappingURL=useVoipSession.js.map