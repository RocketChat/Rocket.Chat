"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var dom_css_1 = __importDefault(require("dom-css"));
var scrollbarWidth = undefined;
var pxRatio = getPxRatio();
function getScrollbarWidth() {
    var newPxRatio = getPxRatio();
    if (pxRatio !== newPxRatio) {
        scrollbarWidth = getScrollbarWidthFromDom();
    }
    if (typeof scrollbarWidth === 'number')
        return scrollbarWidth;
    if (typeof document !== 'undefined') {
        scrollbarWidth = getScrollbarWidthFromDom();
    }
    else {
        scrollbarWidth = 0;
    }
    return scrollbarWidth || 0;
}
exports.default = getScrollbarWidth;
function getScrollbarWidthFromDom() {
    var div = document.createElement('div');
    (0, dom_css_1.default)(div, {
        width: 100,
        height: 100,
        position: 'absolute',
        top: -9999,
        overflow: 'scroll',
        MsOverflowStyle: 'scrollbar',
    });
    document.body.appendChild(div);
    var result = div.offsetWidth - div.clientWidth;
    document.body.removeChild(div);
    return result;
}
function getPxRatio() {
    if (typeof window === 'undefined')
        return 1;
    return window.screen.availWidth / document.documentElement.clientWidth;
}
