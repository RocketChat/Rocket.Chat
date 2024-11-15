let _jsx;module.link("react/jsx-runtime",{jsx(v){_jsx=v}},0);let katex;module.link('katex',{default(v){katex=v}},1);let useMemo;module.link('react',{useMemo(v){useMemo=v}},2);module.link('katex/dist/katex.css');



const KatexBlock = ({ code }) => {
    const html = useMemo(() => katex.renderToString(code, {
        displayMode: true,
        macros: {
            '\\href': '\\@secondoftwo',
        },
        maxSize: 100,
    }), [code]);
    return _jsx("div", { role: 'math', style: { overflowX: 'auto' }, "aria-label": code, dangerouslySetInnerHTML: { __html: html } });
};
module.exportDefault(KatexBlock);
//# sourceMappingURL=KatexBlock.js.map