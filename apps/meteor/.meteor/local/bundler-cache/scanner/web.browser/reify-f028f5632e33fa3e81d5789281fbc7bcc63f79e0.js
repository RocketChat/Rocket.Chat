module.export({useVoipEffect:()=>useVoipEffect},true);let useCallback,useContext,useRef;module.link('react',{useCallback(v){useCallback=v},useContext(v){useContext=v},useRef(v){useRef=v}},0);let useSyncExternalStore;module.link('use-sync-external-store/shim',{useSyncExternalStore(v){useSyncExternalStore=v}},1);let VoipContext;module.link('../contexts/VoipContext',{VoipContext(v){VoipContext=v}},2);


const useVoipEffect = (transform, initialValue) => {
    const { voipClient } = useContext(VoipContext);
    const stateRef = useRef(initialValue);
    const transformFn = useRef(transform);
    const getSnapshot = useCallback(() => stateRef.current, []);
    const subscribe = useCallback((cb) => {
        if (!voipClient)
            return () => undefined;
        stateRef.current = transformFn.current(voipClient);
        return voipClient.on('stateChanged', () => {
            stateRef.current = transformFn.current(voipClient);
            cb();
        });
    }, [voipClient]);
    return useSyncExternalStore(subscribe, getSnapshot);
};
//# sourceMappingURL=useVoipEffect.js.map