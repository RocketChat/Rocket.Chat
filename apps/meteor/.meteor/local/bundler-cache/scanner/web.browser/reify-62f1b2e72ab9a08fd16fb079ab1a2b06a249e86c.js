module.export({getOwnerDocument:()=>$431fbd86ca7dc216$export$b204af158042fbac,getOwnerWindow:()=>$431fbd86ca7dc216$export$f21a1ffae260145a});const $431fbd86ca7dc216$export$b204af158042fbac = (el)=>{
    var _el_ownerDocument;
    return (_el_ownerDocument = el === null || el === void 0 ? void 0 : el.ownerDocument) !== null && _el_ownerDocument !== void 0 ? _el_ownerDocument : document;
};
const $431fbd86ca7dc216$export$f21a1ffae260145a = (el)=>{
    if (el && 'window' in el && el.window === el) return el;
    const doc = $431fbd86ca7dc216$export$b204af158042fbac(el);
    return doc.defaultView || window;
};



//# sourceMappingURL=domHelpers.module.js.map
