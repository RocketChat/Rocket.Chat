"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processAcceptedCall = processAcceptedCall;
const models_1 = require("@rocket.chat/models");
const deliverChannelSDP_1 = require("../channels/deliverChannelSDP");
const getActorChannel_1 = require("../channels/getActorChannel");
// import { requestChannelOffer } from '../channels/requestChannelOffer';
const isValidSignalChannel_1 = require("../signals/isValidSignalChannel");
const sendSignalToChannels_1 = require("../signals/sendSignalToChannels");
const logger_1 = require("../utils/logger");
async function processAcceptedCall(callId) {
    const call = await models_1.MediaCalls.findOneById(callId);
    if (!call) {
        throw new Error('error-failed-to-accept-call');
    }
    const callerChannel = await (0, getActorChannel_1.getActorChannel)(call._id, call.caller);
    if (!callerChannel) {
        throw new Error('error-failed-to-locate-caller-channel');
    }
    const offer = callerChannel.localDescription;
    // If the caller doesn't have a webrtc offer yet, we need to wait for it
    if (!offer) {
        // await requestChannelOffer(callerChannel);
        return;
    }
    if (offer.type !== 'offer') {
        logger_1.logger.error({ msg: 'The local description of a caller channel is not an offer', local: offer });
        throw new Error('unexpected-state');
    }
    const calleeChannel = await (0, getActorChannel_1.getActorChannel)(call._id, call.callee);
    if (!calleeChannel) {
        throw new Error('error-failed-to-locate-callee-channel');
    }
    await (0, deliverChannelSDP_1.deliverChannelSDP)(calleeChannel, {
        sdp: offer,
    });
    const validChannels = [callerChannel, calleeChannel].filter((channel) => (0, isValidSignalChannel_1.isValidSignalChannel)(channel));
    if (validChannels.length) {
        await (0, sendSignalToChannels_1.sendSignalToChannels)(validChannels, {
            type: 'notification',
            body: {
                notification: 'accepted',
            },
        });
    }
}
//# sourceMappingURL=processAcceptedCall.js.map