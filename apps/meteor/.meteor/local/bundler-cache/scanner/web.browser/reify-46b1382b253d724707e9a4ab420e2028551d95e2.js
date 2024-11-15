module.export({useVoipEffect:()=>useVoipEffect},true);let useContext,useMemo,useRef;module.link('react',{useContext(v){useContext=v},useMemo(v){useMemo=v},useRef(v){useRef=v}},0);let useSyncExternalStore;module.link('use-sync-external-store/shim',{useSyncExternalStore(v){useSyncExternalStore=v}},1);let VoipContext;module.link('../contexts/VoipContext',{VoipContext(v){VoipContext=v}},2);


const useVoipEffect = (transform, initialValue) => {
    const { voipClient } = useContext(VoipContext);
    const initValue = useRef(initialValue);
    const transformFn = useRef(transform);
    const [subscribe, getSnapshot] = useMemo(() => {
        let state = initValue.current;
        const getSnapshot = () => state;
        const subscribe = (cb) => {
            if (!voipClient)
                return () => undefined;
            state = transformFn.current(voipClient);
            return voipClient.on('stateChanged', () => {
                state = transformFn.current(voipClient);
                cb();
            });
        };
        return [subscribe, getSnapshot];
    }, [voipClient]);
    return useSyncExternalStore(subscribe, getSnapshot);
};
//# sourceMappingURL=useVoipEffect.js.map