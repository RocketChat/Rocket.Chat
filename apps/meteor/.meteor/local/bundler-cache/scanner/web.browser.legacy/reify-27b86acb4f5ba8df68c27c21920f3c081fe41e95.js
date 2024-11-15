"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.is = void 0;
var _is_between_1 = require("./$is_between");
var _stoll_1 = require("./$stoll");
/**
 * @internal
 */
var is = function () { return ({
    is_between: _is_between_1.$is_between,
    is_bigint_string: _stoll_1.$is_bigint_string,
}); };
exports.is = is;
//# sourceMappingURL=is.js.map