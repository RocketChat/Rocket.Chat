"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const validate_js_1 = require("./validate.js");
function version(uuid) {
    if (!(0, validate_js_1.default)(uuid)) {
        throw TypeError('Invalid UUID');
    }
    return parseInt(uuid.slice(14, 15), 16);
}
exports.default = version;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmVyc2lvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy92ZXJzaW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsK0NBQXFDO0FBRXJDLFNBQVMsT0FBTyxDQUFDLElBQVk7SUFDM0IsSUFBSSxDQUFDLElBQUEscUJBQVEsRUFBQyxJQUFJLENBQUMsRUFBRSxDQUFDO1FBQ3BCLE1BQU0sU0FBUyxDQUFDLGNBQWMsQ0FBQyxDQUFDO0lBQ2xDLENBQUM7SUFFRCxPQUFPLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztBQUMxQyxDQUFDO0FBRUQsa0JBQWUsT0FBTyxDQUFDIn0=