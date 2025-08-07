"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mutateCallee = mutateCallee;
const models_1 = require("@rocket.chat/models");
async function mutateCallee(callee) {
    if (callee.type !== 'sip') {
        return callee;
    }
    const user = await models_1.Users.findOneByFreeSwitchExtension(callee.id, { projection: { _id: 1 } });
    if (user) {
        return { type: 'user', id: user._id };
    }
    return callee;
}
//# sourceMappingURL=mutateCallee.js.map