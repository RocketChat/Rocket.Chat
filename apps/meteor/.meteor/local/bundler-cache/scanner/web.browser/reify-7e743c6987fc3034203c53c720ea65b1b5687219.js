module.export({createAnchor:()=>createAnchor});let registerAnchor;module.link('./deleteAnchor',{registerAnchor(v){registerAnchor=v}},0);
var createAnchor = function (id, tag) {
    if (tag === void 0) { tag = 'div'; }
    var anchor = document.getElementById(id);
    if (anchor && anchor.tagName.toLowerCase() === tag) {
        return anchor;
    }
    var a = document.createElement(tag);
    a.id = id;
    document.body.appendChild(a);
    registerAnchor(a, function () { return document.body.removeChild(a); });
    return a;
};
//# sourceMappingURL=createAnchor.js.map