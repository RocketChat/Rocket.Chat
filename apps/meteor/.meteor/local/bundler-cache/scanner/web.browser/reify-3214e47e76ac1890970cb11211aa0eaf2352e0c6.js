let memo,useEffect,useState;module.link('react',{memo(v){memo=v},useEffect(v){useEffect=v},useState(v){useState=v}},0);let createPortal;module.link('react-dom',{createPortal(v){createPortal=v}},1);let createAnchor;module.link('./lib/utils/createAnchor',{createAnchor(v){createAnchor=v}},2);let deleteAnchor;module.link('./lib/utils/deleteAnchor',{deleteAnchor(v){deleteAnchor=v}},3);



var ToastBarPortal = function (_a) {
    var children = _a.children;
    var toastBarRoot = useState(function () { return createAnchor('toastBarRoot'); })[0];
    useEffect(function () { return function () { return deleteAnchor(toastBarRoot); }; }, [toastBarRoot]);
    return createPortal(children, toastBarRoot);
};
module.exportDefault(memo(ToastBarPortal));
//# sourceMappingURL=ToastBarPortal.js.map