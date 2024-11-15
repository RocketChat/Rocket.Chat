module.export({deleteAnchor:()=>deleteAnchor,registerAnchor:()=>registerAnchor});var anchor = new WeakMap();
var deleteAnchor = function (element) {
    var fn = anchor.get(element);
    if (fn) {
        fn();
    }
};
var registerAnchor = function (element, fn) {
    anchor.set(element, fn);
};
//# sourceMappingURL=deleteAnchor.js.map