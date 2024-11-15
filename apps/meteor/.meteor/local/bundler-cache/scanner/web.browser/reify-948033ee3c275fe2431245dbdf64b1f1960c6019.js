let _Fragment,_jsx,_jsxs;module.link("react/jsx-runtime",{Fragment(v){_Fragment=v},jsx(v){_jsx=v},jsxs(v){_jsxs=v}},0);let Fragment,memo,useContext,useMemo;module.link('react',{Fragment(v){Fragment=v},memo(v){memo=v},useContext(v){useContext=v},useMemo(v){useMemo=v}},1);let useTranslation;module.link('react-i18next',{useTranslation(v){useTranslation=v}},2);let MarkupInteractionContext;module.link('../MarkupInteractionContext',{MarkupInteractionContext(v){MarkupInteractionContext=v}},3);



const PlainSpan = ({ text }) => {
    const { t } = useTranslation();
    const { highlightRegex, markRegex } = useContext(MarkupInteractionContext);
    const content = useMemo(() => {
        var _a, _b;
        if (highlightRegex) {
            const chunks = text.split(highlightRegex());
            const head = (_a = chunks.shift()) !== null && _a !== void 0 ? _a : '';
            return (_jsxs(_Fragment, { children: [_jsx(_Fragment, { children: head }), chunks.map((chunk, i) => {
                        if (i % 2 === 0) {
                            return (_jsx("mark", { title: t('Highlighted_chosen_word'), className: 'highlight-text', children: chunk }, i));
                        }
                        return _jsx(Fragment, { children: chunk }, i);
                    })] }));
        }
        if (markRegex) {
            const chunks = text.split(markRegex());
            const head = (_b = chunks.shift()) !== null && _b !== void 0 ? _b : '';
            return (_jsxs(_Fragment, { children: [_jsx(_Fragment, { children: head }), chunks.map((chunk, i) => {
                        if (i % 2 === 0) {
                            return _jsx("mark", { children: chunk }, i);
                        }
                        return _jsx(Fragment, { children: chunk }, i);
                    })] }));
        }
        return text;
    }, [highlightRegex, markRegex, text, t]);
    return _jsx(_Fragment, { children: content });
};
module.exportDefault(memo(PlainSpan));
//# sourceMappingURL=PlainSpan.js.map