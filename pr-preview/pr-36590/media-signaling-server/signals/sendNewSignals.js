"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNewSignals = sendNewSignals;
const models_1 = require("@rocket.chat/models");
const sendSignalToActor_1 = require("./sendSignalToActor");
async function sendNewSignals(callId) {
    const call = await models_1.MediaCalls.getNewSequence(callId);
    console.log('sendNewSignals', call);
    if (!call) {
        throw new Error('failed-to-create-call');
    }
    const signalBody = {
        service: call.service,
        kind: call.kind,
    };
    const header = {
        callId: call._id,
        type: 'new',
    };
    const roles = ['caller', 'callee'];
    await Promise.all(roles.map(async (role) => {
        const actor = call[role];
        await (0, sendSignalToActor_1.sendSignalToActor)(actor, {
            ...header,
            body: {
                ...signalBody,
                role,
            },
        });
    }));
    return call;
}
//# sourceMappingURL=sendNewSignals.js.map