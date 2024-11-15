module.export({useVoipAPI:function(){return useVoipAPI}},true);var useContext,useMemo;module.link('react',{useContext:function(v){useContext=v},useMemo:function(v){useMemo=v}},0);var VoipContext,isVoipContextReady;module.link('../contexts/VoipContext',{VoipContext:function(v){VoipContext=v},isVoipContextReady:function(v){isVoipContextReady=v}},1);

const NOOP = (..._args) => undefined;
const useVoipAPI = () => {
    const context = useContext(VoipContext);
    return useMemo(() => {
        if (!isVoipContextReady(context)) {
            return {
                makeCall: NOOP,
                endCall: NOOP,
                register: NOOP,
                unregister: NOOP,
                openDialer: NOOP,
                closeDialer: NOOP,
                transferCall: NOOP,
                changeAudioInputDevice: NOOP,
                changeAudioOutputDevice: NOOP,
                onRegisteredOnce: NOOP,
                onUnregisteredOnce: NOOP,
            };
        }
        const { voipClient, changeAudioInputDevice, changeAudioOutputDevice } = context;
        return {
            makeCall: voipClient.call,
            endCall: voipClient.endCall,
            register: voipClient.register,
            unregister: voipClient.unregister,
            transferCall: voipClient.transfer,
            openDialer: () => voipClient.notifyDialer({ open: true }),
            closeDialer: () => voipClient.notifyDialer({ open: false }),
            changeAudioInputDevice,
            changeAudioOutputDevice,
            onRegisteredOnce: (cb) => voipClient.once('registered', cb),
            onUnregisteredOnce: (cb) => voipClient.once('unregistered', cb),
        };
    }, [context]);
};
//# sourceMappingURL=useVoipAPI.js.map