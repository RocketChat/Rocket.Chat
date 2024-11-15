"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.$every = void 0;
var $every = function (array, pred) {
    var error = null;
    for (var i = 0; i < array.length; ++i)
        if (null !== (error = pred(array[i], i)))
            return error;
    return null;
};
exports.$every = $every;
//# sourceMappingURL=$every.js.map