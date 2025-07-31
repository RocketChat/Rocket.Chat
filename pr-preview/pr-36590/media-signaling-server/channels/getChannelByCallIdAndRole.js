"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChannelByCallIdAndRole = getChannelByCallIdAndRole;
const models_1 = require("@rocket.chat/models");
const getActorChannel_1 = require("./getActorChannel");
async function getChannelByCallIdAndRole(callId, role) {
    const call = await models_1.MediaCalls.findOneById(callId, { projection: { [role]: 1 } });
    if (!call) {
        return null;
    }
    const { [role]: actor } = call;
    if (!actor) {
        return null;
    }
    return (0, getActorChannel_1.getActorChannel)(callId, actor);
}
//# sourceMappingURL=getChannelByCallIdAndRole.js.map