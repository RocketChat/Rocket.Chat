"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cssSupports = void 0;
var memo_1 = require("@rocket.chat/memo");
exports.cssSupports = typeof window !== 'undefined' &&
    typeof window.CSS !== 'undefined' &&
    window.CSS.supports
    ? memo_1.memoize(function (value) { return window.CSS.supports(value); })
    : function () { return false; };
//# sourceMappingURL=index.js.map