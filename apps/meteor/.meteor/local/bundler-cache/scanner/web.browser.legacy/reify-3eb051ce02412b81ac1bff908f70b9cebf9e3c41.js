var _jsx;module.link("react/jsx-runtime",{jsx:function(v){_jsx=v}},0);var katex;module.link('katex',{default:function(v){katex=v}},1);var useMemo;module.link('react',{useMemo:function(v){useMemo=v}},2);module.link('katex/dist/katex.css');



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