"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function getInnerWidth(el) {
    if (!el)
        return 0;
    var clientWidth = el.clientWidth;
    var _a = getComputedStyle(el), paddingLeft = _a.paddingLeft, paddingRight = _a.paddingRight;
    return clientWidth - parseFloat(paddingLeft) - parseFloat(paddingRight);
}
exports.default = getInnerWidth;
