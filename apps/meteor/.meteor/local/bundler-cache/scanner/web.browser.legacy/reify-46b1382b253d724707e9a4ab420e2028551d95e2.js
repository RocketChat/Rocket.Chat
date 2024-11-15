module.export({useVoipEffect:function(){return useVoipEffect}},true);var useContext,useMemo,useRef;module.link('react',{useContext:function(v){useContext=v},useMemo:function(v){useMemo=v},useRef:function(v){useRef=v}},0);var useSyncExternalStore;module.link('use-sync-external-store/shim',{useSyncExternalStore:function(v){useSyncExternalStore=v}},1);var VoipContext;module.link('../contexts/VoipContext',{VoipContext:function(v){VoipContext=v}},2);


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