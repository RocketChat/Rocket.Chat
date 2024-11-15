module.export({useVoipEvent:function(){return useVoipEvent}},true);var useContext,useMemo,useRef;module.link('react',{useContext:function(v){useContext=v},useMemo:function(v){useMemo=v},useRef:function(v){useRef=v}},0);var useSyncExternalStore;module.link('use-sync-external-store/shim',{useSyncExternalStore:function(v){useSyncExternalStore=v}},1);var VoipContext;module.link('../contexts/VoipContext',{VoipContext:function(v){VoipContext=v}},2);


const useVoipEvent = (eventName, initialValue) => {
    const { voipClient } = useContext(VoipContext);
    const initValue = useRef(initialValue);
    const [subscribe, getSnapshot] = useMemo(() => {
        let state = initValue.current;
        const getSnapshot = () => state;
        const callback = (cb) => {
            if (!voipClient)
                return () => undefined;
            return voipClient.on(eventName, (event) => {
                state = event;
                cb();
            });
        };
        return [callback, getSnapshot];
    }, [eventName, voipClient]);
    return useSyncExternalStore(subscribe, getSnapshot);
};
//# sourceMappingURL=useVoipEvent.js.map