"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.$report = void 0;
var $report = function (array) {
    var reportable = function (path) {
        if (array.length === 0)
            return true;
        var last = array[array.length - 1].path;
        return path.length > last.length || last.substring(0, path.length) !== path;
    };
    return function (exceptable, error) {
        if (exceptable && reportable(error.path))
            array.push(error);
        return false;
    };
};
exports.$report = $report;
//# sourceMappingURL=$report.js.map