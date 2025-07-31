"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOppositeChannel = getOppositeChannel;
const getActorChannel_1 = require("./getActorChannel");
const getChannelByCallIdAndRole_1 = require("./getChannelByCallIdAndRole");
const isValidSignalRole_1 = require("../signals/isValidSignalRole");
async function getOppositeChannel(call, channel, options) {
    if (!(0, isValidSignalRole_1.isValidSignalRole)(channel.role)) {
        return null;
    }
    const { reloadCallIfNull = false } = options || {};
    const oppositeRole = channel.role === 'caller' ? 'callee' : 'caller';
    const otherChannel = await (0, getActorChannel_1.getActorChannel)(call._id, call[oppositeRole]);
    if (otherChannel || !reloadCallIfNull) {
        return otherChannel;
    }
    // If no channel was found, using the data from the call object, reload the call and try again
    // This is needed because the call might have been accepted by ther other participant at the same time as this request.
    return (0, getChannelByCallIdAndRole_1.getChannelByCallIdAndRole)(call._id, oppositeRole);
}
//# sourceMappingURL=getOppositeChannel.js.map