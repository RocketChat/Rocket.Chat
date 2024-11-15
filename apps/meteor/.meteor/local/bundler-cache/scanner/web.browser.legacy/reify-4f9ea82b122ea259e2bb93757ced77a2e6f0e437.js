module.export({useDocumentTitle:function(){return useDocumentTitle}},true);var Emitter;module.link('@rocket.chat/emitter',{Emitter:function(v){Emitter=v}},0);var useCallback,useEffect;module.link('react',{useCallback:function(v){useCallback=v},useEffect:function(v){useEffect=v}},1);var useSyncExternalStore;module.link('use-sync-external-store/shim',{useSyncExternalStore:function(v){useSyncExternalStore=v}},2);


const ee = new Emitter();
const titles = new Set();
const useReactiveDocumentTitle = () => useSyncExternalStore(useCallback((callback) => ee.on('change', callback), []), () => Array.from(titles)
    .reverse()
    .map(({ title }) => title)
    .join(' - '));
const useReactiveDocumentTitleKey = () => useSyncExternalStore(useCallback((callback) => ee.on('change', callback), []), () => Array.from(titles)
    .filter(({ refocus }) => refocus)
    .map(({ title }) => title)
    .join(' - '));
const useDocumentTitle = (documentTitle, refocus = true) => {
    useEffect(() => {
        const titleObj = {
            title: documentTitle,
            refocus,
        };
        if (titleObj.title) {
            titles.add(titleObj);
        }
        ee.emit('change');
        return () => {
            titles.delete(titleObj);
            ee.emit('change');
        };
    }, [documentTitle, refocus]);
    return { title: useReactiveDocumentTitle(), key: useReactiveDocumentTitleKey() };
};
//# sourceMappingURL=useDocumentTitle.js.map