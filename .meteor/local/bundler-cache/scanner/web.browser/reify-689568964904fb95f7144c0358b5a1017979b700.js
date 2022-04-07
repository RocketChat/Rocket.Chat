"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function getInnerHeight(el) {
    if (!el)
        return 0;
    var clientHeight = el.clientHeight;
    var _a = getComputedStyle(el), paddingTop = _a.paddingTop, paddingBottom = _a.paddingBottom;
    return clientHeight - parseFloat(paddingTop) - parseFloat(paddingBottom);
}
exports.default = getInnerHeight;
