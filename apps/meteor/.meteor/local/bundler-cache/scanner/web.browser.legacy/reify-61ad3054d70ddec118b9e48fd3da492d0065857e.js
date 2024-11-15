"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAnchor = void 0;
var deleteAnchor_1 = require("./deleteAnchor");
var createAnchor = function (id, tag) {
    if (tag === void 0) { tag = 'div'; }
    var anchor = document.getElementById(id);
    if (anchor && anchor.tagName.toLowerCase() === tag) {
        return anchor;
    }
    var a = document.createElement(tag);
    a.id = id;
    document.body.appendChild(a);
    (0, deleteAnchor_1.registerAnchor)(a, function () { return document.body.removeChild(a); });
    return a;
};
exports.createAnchor = createAnchor;
//# sourceMappingURL=createAnchor.js.map