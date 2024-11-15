"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.URL = exports.DNS = void 0;
const sha1_js_1 = require("./sha1.js");
const v35_js_1 = require("./v35.js");
var v35_js_2 = require("./v35.js");
Object.defineProperty(exports, "DNS", { enumerable: true, get: function () { return v35_js_2.DNS; } });
Object.defineProperty(exports, "URL", { enumerable: true, get: function () { return v35_js_2.URL; } });
function v5(value, namespace, buf, offset) {
    return (0, v35_js_1.default)(0x50, sha1_js_1.default, value, namespace, buf, offset);
}
v5.DNS = v35_js_1.DNS;
v5.URL = v35_js_1.URL;
exports.default = v5;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidjUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvdjUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0EsdUNBQTZCO0FBQzdCLHFDQUF5QztBQUV6QyxtQ0FBb0M7QUFBM0IsNkZBQUEsR0FBRyxPQUFBO0FBQUUsNkZBQUEsR0FBRyxPQUFBO0FBY2pCLFNBQVMsRUFBRSxDQUFDLEtBQTBCLEVBQUUsU0FBb0IsRUFBRSxHQUFnQixFQUFFLE1BQWU7SUFDN0YsT0FBTyxJQUFBLGdCQUFHLEVBQUMsSUFBSSxFQUFFLGlCQUFJLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxHQUFHLEVBQUUsTUFBTSxDQUFDLENBQUM7QUFDeEQsQ0FBQztBQUVELEVBQUUsQ0FBQyxHQUFHLEdBQUcsWUFBRyxDQUFDO0FBQ2IsRUFBRSxDQUFDLEdBQUcsR0FBRyxZQUFHLENBQUM7QUFFYixrQkFBZSxFQUFFLENBQUMifQ==