"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processSignal = processSignal;
const models_1 = require("@rocket.chat/models");
const getChannelForSignal_1 = require("./getChannelForSignal");
const processAnswer_1 = require("./processAnswer");
const processHangup_1 = require("./processHangup");
const processSDP_1 = require("./processSDP");
const getRoleForActor_1 = require("../channels/getRoleForActor");
const assertSignalHasSessionId_1 = require("../utils/assertSignalHasSessionId");
const compareParticipantAndActor_1 = require("../utils/compareParticipantAndActor");
async function processSignal(signal, uid) {
    (0, assertSignalHasSessionId_1.assertSignalHasSessionId)(signal);
    console.log('server.processSignal', signal, uid);
    try {
        const call = await models_1.MediaCalls.findOneById(signal.callId);
        if (!call) {
            throw new Error('invalid-call');
        }
        const user = await models_1.Users.findOneById(uid, { projection: { username: 1, name: 1 } });
        if (!user?.username || !user?.name) {
            throw new Error('invalid-user');
        }
        const actor = { type: 'user', id: user._id, sessionId: signal.sessionId };
        const role = (0, getRoleForActor_1.getRoleForActor)(call, actor);
        if (!role) {
            throw new Error('invalid-role');
        }
        const channel = await (0, getChannelForSignal_1.getChannelForSignal)({
            callId: call._id,
            participant: {
                ...actor,
                username: user.username,
                displayName: user.name,
            },
            role,
        });
        // This shouldn't be possible unless something tried to switch the roles of the call's actors
        if (channel.role !== role || !(0, compareParticipantAndActor_1.compareParticipantAndActor)(channel.participant, call[channel.role])) {
            throw new Error('invalid-channel-data');
        }
        switch (signal.type) {
            case 'sdp':
                await (0, processSDP_1.processSDP)(signal.body, call, channel);
                break;
            case 'error':
                // #ToDo
                break;
            case 'answer':
                await (0, processAnswer_1.processAnswer)(signal.body, call, channel);
                break;
            case 'hangup':
                await (0, processHangup_1.processHangup)(signal.body, call, channel);
                break;
        }
    }
    catch (e) {
        console.log(e);
        throw e;
    }
}
//# sourceMappingURL=processSignal.js.map