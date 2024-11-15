"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.functionalAssert = void 0;
var TypeGuardError_1 = require("../../TypeGuardError");
var functionalAssert = function () { return ({
    errorFactory: function (p) { return new TypeGuardError_1.TypeGuardError(p); },
}); };
exports.functionalAssert = functionalAssert;
//# sourceMappingURL=functional.js.map