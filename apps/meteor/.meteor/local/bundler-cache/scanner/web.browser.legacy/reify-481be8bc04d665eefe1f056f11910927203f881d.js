var _jsx;module.link("react/jsx-runtime",{jsx:function(v){_jsx=v}},0);var katex;module.link('katex',{default:function(v){katex=v}},1);var useMemo;module.link('react',{useMemo:function(v){useMemo=v}},2);module.link('katex/dist/katex.css');



const KatexElement = ({ code }) => {
    const html = useMemo(() => katex.renderToString(code, {
        displayMode: false,
        macros: {
            '\\href': '\\@secondoftwo',
        },
        maxSize: 100,
    }), [code]);
    return _jsx("span", { dangerouslySetInnerHTML: { __html: html } });
};
module.exportDefault(KatexElement);
//# sourceMappingURL=KatexElement.js.map