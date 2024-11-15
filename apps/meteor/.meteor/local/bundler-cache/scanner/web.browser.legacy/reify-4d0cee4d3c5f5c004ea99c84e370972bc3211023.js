module.export({PreviewCodeBlock:function(){return PreviewCodeBlock}},true);var _Fragment,_jsx;module.link("react/jsx-runtime",{Fragment:function(v){_Fragment=v},jsx:function(v){_jsx=v}},0);var useMemo;module.link('react',{useMemo:function(v){useMemo=v}},1);

const PreviewCodeBlock = ({ lines }) => {
    const firstLine = useMemo(() => { var _a; return (_a = lines.find((line) => line.value.value.trim())) === null || _a === void 0 ? void 0 : _a.value.value.trim(); }, [lines]);
    if (!firstLine) {
        return null;
    }
    return _jsx(_Fragment, { children: firstLine });
};
module.exportDefault(PreviewCodeBlock);
//# sourceMappingURL=PreviewCodeBlock.js.map