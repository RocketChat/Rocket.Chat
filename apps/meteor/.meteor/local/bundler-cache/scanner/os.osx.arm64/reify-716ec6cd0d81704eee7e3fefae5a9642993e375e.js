"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const stringify_js_1 = require("./stringify.js");
const v1_js_1 = require("./v1.js");
const v1ToV6_js_1 = require("./v1ToV6.js");
function v6(options, buf, offset) {
    options ??= {};
    offset ??= 0;
    let bytes = (0, v1_js_1.default)({ ...options, _v6: true }, new Uint8Array(16));
    bytes = (0, v1ToV6_js_1.default)(bytes);
    if (buf) {
        for (let i = 0; i < 16; i++) {
            buf[offset + i] = bytes[i];
        }
        return buf;
    }
    return (0, stringify_js_1.unsafeStringify)(bytes);
}
exports.default = v6;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidjYuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvdjYudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFDQSxpREFBaUQ7QUFDakQsbUNBQXlCO0FBQ3pCLDJDQUFpQztBQUlqQyxTQUFTLEVBQUUsQ0FBQyxPQUF5QixFQUFFLEdBQWdCLEVBQUUsTUFBZTtJQUN0RSxPQUFPLEtBQUssRUFBRSxDQUFDO0lBQ2YsTUFBTSxLQUFLLENBQUMsQ0FBQztJQUtiLElBQUksS0FBSyxHQUFHLElBQUEsZUFBRSxFQUFDLEVBQUUsR0FBRyxPQUFPLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxFQUFFLElBQUksVUFBVSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFHOUQsS0FBSyxHQUFHLElBQUEsbUJBQU0sRUFBQyxLQUFLLENBQUMsQ0FBQztJQUd0QixJQUFJLEdBQUcsRUFBRSxDQUFDO1FBQ1IsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQzVCLEdBQUcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzdCLENBQUM7UUFDRCxPQUFPLEdBQUcsQ0FBQztJQUNiLENBQUM7SUFFRCxPQUFPLElBQUEsOEJBQWUsRUFBQyxLQUFLLENBQUMsQ0FBQztBQUNoQyxDQUFDO0FBRUQsa0JBQWUsRUFBRSxDQUFDIn0=