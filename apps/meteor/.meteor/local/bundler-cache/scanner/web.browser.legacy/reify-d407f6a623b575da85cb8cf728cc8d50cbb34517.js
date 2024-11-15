"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.$is_bigint_string = void 0;
var $is_bigint_string = function (str) {
    try {
        BigInt(str);
        return true;
    }
    catch (_a) {
        return false;
    }
};
exports.$is_bigint_string = $is_bigint_string;
//# sourceMappingURL=$stoll.js.map