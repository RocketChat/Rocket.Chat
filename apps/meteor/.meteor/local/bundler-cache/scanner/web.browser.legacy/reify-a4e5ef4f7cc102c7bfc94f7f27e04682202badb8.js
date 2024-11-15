"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAnchor = exports.deleteAnchor = void 0;
var anchor = new WeakMap();
var deleteAnchor = function (element) {
    var fn = anchor.get(element);
    if (fn) {
        fn();
    }
};
exports.deleteAnchor = deleteAnchor;
var registerAnchor = function (element, fn) {
    anchor.set(element, fn);
};
exports.registerAnchor = registerAnchor;
//# sourceMappingURL=deleteAnchor.js.map