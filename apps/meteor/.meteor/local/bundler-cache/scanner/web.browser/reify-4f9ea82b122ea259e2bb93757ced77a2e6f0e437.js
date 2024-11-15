module.export({useDocumentTitle:()=>useDocumentTitle},true);let Emitter;module.link('@rocket.chat/emitter',{Emitter(v){Emitter=v}},0);let useCallback,useEffect;module.link('react',{useCallback(v){useCallback=v},useEffect(v){useEffect=v}},1);let useSyncExternalStore;module.link('use-sync-external-store/shim',{useSyncExternalStore(v){useSyncExternalStore=v}},2);


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