"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse = void 0;
var tslib_1 = require("tslib");
var error_1 = require("./error");
var parser_1 = require("./parser");
var types_1 = require("./types");
function pruneLocation(els) {
    els.forEach(function (el) {
        delete el.location;
        if ((0, types_1.isSelectElement)(el) || (0, types_1.isPluralElement)(el)) {
            for (var k in el.options) {
                delete el.options[k].location;
                pruneLocation(el.options[k].value);
            }
        }
        else if ((0, types_1.isNumberElement)(el) && (0, types_1.isNumberSkeleton)(el.style)) {
            delete el.style.location;
        }
        else if (((0, types_1.isDateElement)(el) || (0, types_1.isTimeElement)(el)) &&
            (0, types_1.isDateTimeSkeleton)(el.style)) {
            delete el.style.location;
        }
        else if ((0, types_1.isTagElement)(el)) {
            pruneLocation(el.children);
        }
    });
}
function parse(message, opts) {
    if (opts === void 0) { opts = {}; }
    opts = tslib_1.__assign({ shouldParseSkeletons: true, requiresOtherClause: true }, opts);
    var result = new parser_1.Parser(message, opts).parse();
    if (result.err) {
        var error = SyntaxError(error_1.ErrorKind[result.err.kind]);
        // @ts-expect-error Assign to error object
        error.location = result.err.location;
        // @ts-expect-error Assign to error object
        error.originalMessage = result.err.message;
        throw error;
    }
    if (!(opts === null || opts === void 0 ? void 0 : opts.captureLocation)) {
        pruneLocation(result.val);
    }
    return result.val;
}
exports.parse = parse;
tslib_1.__exportStar(require("./types"), exports);
