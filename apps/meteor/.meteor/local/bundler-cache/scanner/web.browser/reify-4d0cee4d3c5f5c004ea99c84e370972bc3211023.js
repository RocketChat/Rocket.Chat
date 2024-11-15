module.export({PreviewCodeBlock:()=>PreviewCodeBlock},true);let _Fragment,_jsx;module.link("react/jsx-runtime",{Fragment(v){_Fragment=v},jsx(v){_jsx=v}},0);let useMemo;module.link('react',{useMemo(v){useMemo=v}},1);

const PreviewCodeBlock = ({ lines }) => {
    const firstLine = useMemo(() => { var _a; return (_a = lines.find((line) => line.value.value.trim())) === null || _a === void 0 ? void 0 : _a.value.value.trim(); }, [lines]);
    if (!firstLine) {
        return null;
    }
    return _jsx(_Fragment, { children: firstLine });
};
module.exportDefault(PreviewCodeBlock);
//# sourceMappingURL=PreviewCodeBlock.js.map