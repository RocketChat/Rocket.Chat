"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDepartmentCreationAvailable = void 0;
const models_1 = require("@rocket.chat/models");
const patch_injection_1 = require("@rocket.chat/patch-injection");
exports.isDepartmentCreationAvailable = (0, patch_injection_1.makeFunction)(async () => {
    // Only one department can exist at a time
    return (await models_1.LivechatDepartment.countTotal()) === 0;
});
//# sourceMappingURL=isDepartmentCreationAvailable.js.map