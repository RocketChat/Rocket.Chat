"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const regex_js_1 = require("./regex.js");
function validate(uuid) {
    return typeof uuid === 'string' && regex_js_1.default.test(uuid);
}
exports.default = validate;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmFsaWRhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvdmFsaWRhdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSx5Q0FBK0I7QUFFL0IsU0FBUyxRQUFRLENBQUMsSUFBYTtJQUM3QixPQUFPLE9BQU8sSUFBSSxLQUFLLFFBQVEsSUFBSSxrQkFBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUN0RCxDQUFDO0FBRUQsa0JBQWUsUUFBUSxDQUFDIn0=