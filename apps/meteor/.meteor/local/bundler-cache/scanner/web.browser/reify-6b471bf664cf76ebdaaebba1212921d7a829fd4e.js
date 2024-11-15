module.export({useVoipEvent:()=>useVoipEvent},true);let useContext,useMemo,useRef;module.link('react',{useContext(v){useContext=v},useMemo(v){useMemo=v},useRef(v){useRef=v}},0);let useSyncExternalStore;module.link('use-sync-external-store/shim',{useSyncExternalStore(v){useSyncExternalStore=v}},1);let VoipContext;module.link('../contexts/VoipContext',{VoipContext(v){VoipContext=v}},2);


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