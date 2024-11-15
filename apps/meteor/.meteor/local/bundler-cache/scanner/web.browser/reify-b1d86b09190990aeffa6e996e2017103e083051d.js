let _Fragment,_jsx,_jsxs;module.link("react/jsx-runtime",{Fragment(v){_Fragment=v},jsx(v){_jsx=v},jsxs(v){_jsxs=v}},0);let hljs;module.link('highlight.js',{default(v){hljs=v}},1);let Fragment,useContext,useLayoutEffect,useMemo,useRef;module.link('react',{Fragment(v){Fragment=v},useContext(v){useContext=v},useLayoutEffect(v){useLayoutEffect=v},useMemo(v){useMemo=v},useRef(v){useRef=v}},2);let MarkupInteractionContext;module.link('../MarkupInteractionContext',{MarkupInteractionContext(v){MarkupInteractionContext=v}},3);



const CodeBlock = ({ lines = [], language }) => {
    const ref = useRef(null);
    const { highlightRegex } = useContext(MarkupInteractionContext);
    const code = useMemo(() => lines.map((line) => line.value.value).join('\n'), [lines]);
    const content = useMemo(() => {
        var _a;
        const regex = highlightRegex === null || highlightRegex === void 0 ? void 0 : highlightRegex();
        if (regex) {
            const chunks = code.split(regex);
            const head = (_a = chunks.shift()) !== null && _a !== void 0 ? _a : '';
            return (_jsxs(_Fragment, { children: [_jsx(_Fragment, { children: head }), chunks.map((chunk, i) => {
                        if (i % 2 === 0) {
                            return (_jsx("mark", { className: 'highlight-text', children: chunk }, i));
                        }
                        return _jsx(Fragment, { children: chunk }, i);
                    })] }));
        }
        return code;
    }, [code, highlightRegex]);
    useLayoutEffect(() => {
        const element = ref.current;
        if (!element) {
            return;
        }
        hljs.highlightElement(element);
        if (!element.classList.contains('hljs')) {
            element.classList.add('hljs');
        }
    }, [language, content]);
    return (_jsxs("pre", { role: 'region', children: [_jsx("span", { className: 'copyonly', children: "```" }), _jsx("code", { ref: ref, className: ((!language || language === 'none') && 'code-colors') || `code-colors language-${language}`, children: content }, language + code), _jsx("span", { className: 'copyonly', children: "```" })] }));
};
module.exportDefault(CodeBlock);
//# sourceMappingURL=CodeBlock.js.map