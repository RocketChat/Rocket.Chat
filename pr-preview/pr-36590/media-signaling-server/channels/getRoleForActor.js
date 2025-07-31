"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRoleForActor = getRoleForActor;
const compareActorsIgnoringSession_1 = require("../utils/compareActorsIgnoringSession");
function getRoleForActor(call, actor) {
    if ((0, compareActorsIgnoringSession_1.compareActorsIgnoringSession)(call.caller, actor)) {
        return 'caller';
    }
    if ((0, compareActorsIgnoringSession_1.compareActorsIgnoringSession)(call.callee, actor)) {
        return 'callee';
    }
    return null;
}
//# sourceMappingURL=getRoleForActor.js.map