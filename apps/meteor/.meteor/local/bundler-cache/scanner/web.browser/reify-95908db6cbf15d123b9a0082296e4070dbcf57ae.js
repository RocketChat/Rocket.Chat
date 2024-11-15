let _Fragment,_jsx;module.link("react/jsx-runtime",{Fragment(v){_Fragment=v},jsx(v){_jsx=v}},0);let useLayoutEffect;module.link('react',{useLayoutEffect(v){useLayoutEffect=v}},1);let createPortal;module.link('react-dom',{createPortal(v){createPortal=v}},2);let ensureAnchorElement,refAnchorElement,unrefAnchorElement;module.link('../helpers/anchors',{ensureAnchorElement(v){ensureAnchorElement=v},refAnchorElement(v){refAnchorElement=v},unrefAnchorElement(v){unrefAnchorElement=v}},3);



const AnchorPortal = ({ id, children }) => {
    const anchorElement = ensureAnchorElement(id);
    useLayoutEffect(() => {
        refAnchorElement(anchorElement);
        return () => {
            unrefAnchorElement(anchorElement);
        };
    }, [anchorElement]);
    return _jsx(_Fragment, { children: createPortal(children, anchorElement) });
};
module.exportDefault(AnchorPortal);
//# sourceMappingURL=AnchorPortal.js.map