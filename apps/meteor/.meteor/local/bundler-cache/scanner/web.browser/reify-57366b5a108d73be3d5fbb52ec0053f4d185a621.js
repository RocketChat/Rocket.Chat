"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isVoipEventCallAbandoned = exports.isVoipEventQueueMemberRemoved = exports.isVoipEventQueueMemberAdded = exports.isVoipEventCallerJoined = exports.isVoipEventAgentConnected = exports.isVoipEventAgentCalled = void 0;
const isVoipEventAgentCalled = (data) => data.event === 'agent-called';
exports.isVoipEventAgentCalled = isVoipEventAgentCalled;
const isVoipEventAgentConnected = (data) => data.event === 'agent-connected';
exports.isVoipEventAgentConnected = isVoipEventAgentConnected;
const isVoipEventCallerJoined = (data) => data.event === 'caller-joined';
exports.isVoipEventCallerJoined = isVoipEventCallerJoined;
const isVoipEventQueueMemberAdded = (data) => data.event === 'queue-member-added';
exports.isVoipEventQueueMemberAdded = isVoipEventQueueMemberAdded;
const isVoipEventQueueMemberRemoved = (data) => data.event === 'queue-member-removed';
exports.isVoipEventQueueMemberRemoved = isVoipEventQueueMemberRemoved;
const isVoipEventCallAbandoned = (data) => data.event === 'call-abandoned';
exports.isVoipEventCallAbandoned = isVoipEventCallAbandoned;
//# sourceMappingURL=IVoipClientEvents.js.map