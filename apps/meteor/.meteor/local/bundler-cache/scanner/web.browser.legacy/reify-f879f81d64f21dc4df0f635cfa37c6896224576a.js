"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.$number = void 0;
var TypeGuardError_1 = require("../TypeGuardError");
var $number = function (value) {
    if (isFinite(value) === false)
        throw new TypeGuardError_1.TypeGuardError({
            method: "typia.json.stringify",
            expected: "number",
            value: value,
            message: "Error on typia.json.stringify(): infinite or not a number.",
        });
    return value;
};
exports.$number = $number;
//# sourceMappingURL=$number.js.map