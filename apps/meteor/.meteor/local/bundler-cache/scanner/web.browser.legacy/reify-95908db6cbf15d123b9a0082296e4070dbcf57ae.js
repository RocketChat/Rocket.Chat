var _Fragment,_jsx;module.link("react/jsx-runtime",{Fragment:function(v){_Fragment=v},jsx:function(v){_jsx=v}},0);var useLayoutEffect;module.link('react',{useLayoutEffect:function(v){useLayoutEffect=v}},1);var createPortal;module.link('react-dom',{createPortal:function(v){createPortal=v}},2);var ensureAnchorElement,refAnchorElement,unrefAnchorElement;module.link('../helpers/anchors',{ensureAnchorElement:function(v){ensureAnchorElement=v},refAnchorElement:function(v){refAnchorElement=v},unrefAnchorElement:function(v){unrefAnchorElement=v}},3);



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