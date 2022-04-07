
"use strict";
// Note: the following line is added by gulpfile.js's buildSrcFixCommonJsIndexTask() to allow require('autolinker') to work correctly
exports = module.exports = require('./autolinker').default;  // redefine 'exports' object as the Autolinker class itself
// WARNING: This file is modified a bit when it is compiled into index.js in 
// order to support nodejs interoperability with require('autolinker') directly. 
// This is done by the buildSrcFixCommonJsIndexTask() function in the gulpfile. 
// See that function for more details.
Object.defineProperty(exports, "__esModule", { value: true });
exports.Autolinker = void 0;
var tslib_1 = require("tslib");
var autolinker_1 = tslib_1.__importDefault(require("./autolinker"));
exports.Autolinker = autolinker_1.default;
exports.default = autolinker_1.default;
tslib_1.__exportStar(require("./autolinker"), exports);
tslib_1.__exportStar(require("./anchor-tag-builder"), exports);
tslib_1.__exportStar(require("./html-tag"), exports);
tslib_1.__exportStar(require("./match/index"), exports);
tslib_1.__exportStar(require("./matcher/index"), exports);

//# sourceMappingURL=index.js.map
