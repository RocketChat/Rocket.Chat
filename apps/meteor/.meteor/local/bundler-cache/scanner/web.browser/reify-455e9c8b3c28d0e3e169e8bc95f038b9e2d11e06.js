module.export({parse:()=>parse});let __assign;module.link("tslib",{__assign(v){__assign=v}},0);let ErrorKind;module.link('./error',{ErrorKind(v){ErrorKind=v}},1);let Parser;module.link('./parser',{Parser(v){Parser=v}},2);let isDateElement,isDateTimeSkeleton,isNumberElement,isNumberSkeleton,isPluralElement,isSelectElement,isTagElement,isTimeElement;module.link('./types',{isDateElement(v){isDateElement=v},isDateTimeSkeleton(v){isDateTimeSkeleton=v},isNumberElement(v){isNumberElement=v},isNumberSkeleton(v){isNumberSkeleton=v},isPluralElement(v){isPluralElement=v},isSelectElement(v){isSelectElement=v},isTagElement(v){isTagElement=v},isTimeElement(v){isTimeElement=v}},3);module.link('./types',{"*":"*"},4);



function pruneLocation(els) {
    els.forEach(function (el) {
        delete el.location;
        if (isSelectElement(el) || isPluralElement(el)) {
            for (var k in el.options) {
                delete el.options[k].location;
                pruneLocation(el.options[k].value);
            }
        }
        else if (isNumberElement(el) && isNumberSkeleton(el.style)) {
            delete el.style.location;
        }
        else if ((isDateElement(el) || isTimeElement(el)) &&
            isDateTimeSkeleton(el.style)) {
            delete el.style.location;
        }
        else if (isTagElement(el)) {
            pruneLocation(el.children);
        }
    });
}
function parse(message, opts) {
    if (opts === void 0) { opts = {}; }
    opts = __assign({ shouldParseSkeletons: true, requiresOtherClause: true }, opts);
    var result = new Parser(message, opts).parse();
    if (result.err) {
        var error = SyntaxError(ErrorKind[result.err.kind]);
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

