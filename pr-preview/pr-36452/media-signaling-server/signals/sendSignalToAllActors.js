"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllActors = getAllActors;
exports.sendSignalToAllActors = sendSignalToAllActors;
const sendSignalToActor_1 = require("./sendSignalToActor");
function getActorData(call, role, options) {
    const { onlyDefinedSessions = false, targetedSignal = false } = options || {};
    const actor = call[role];
    if (actor?.type !== 'user') {
        return null;
    }
    if (!actor.sessionId && onlyDefinedSessions) {
        return null;
    }
    if (!targetedSignal) {
        const { sessionId, ...actorData } = actor;
        return actorData;
    }
    return actor;
}
async function getAllActors(call, options = {}) {
    const subOptions = {
        onlyDefinedSessions: options.onlyDefinedSessions ?? false,
        targetedSignal: options.targetedSignal ?? false,
    };
    return [getActorData(call, 'caller', subOptions), getActorData(call, 'callee', subOptions)].filter((data) => data);
}
async function sendSignalToAllActors(call, signal, options = {}) {
    const actors = await getAllActors(call, options);
    await Promise.all(actors.map(async (actor) => (0, sendSignalToActor_1.sendSignalToActor)(actor, {
        callId: call._id,
        ...signal,
    })));
}
//# sourceMappingURL=sendSignalToAllActors.js.map