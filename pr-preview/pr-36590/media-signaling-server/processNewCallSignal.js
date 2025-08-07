"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processNewCallSignal = processNewCallSignal;
const models_1 = require("@rocket.chat/models");
const createCall_1 = require("./createCall");
const mutateCallee_1 = require("./mutateCallee");
const signalHandler_1 = require("./signalHandler");
function invalidCallId(uid, rejection) {
    void (0, signalHandler_1.sendSignal)(uid, { type: 'rejected-call-request', ...rejection }).catch(() => null);
    throw new Error(rejection.reason ?? 'invalid-call-id');
}
async function getExistingCall(uid, signal, callee) {
    const { callId: requestedCallId, callee: originalCallee } = signal;
    if (!requestedCallId) {
        return null;
    }
    console.log('getExistingCall');
    const caller = { type: 'user', id: uid };
    const rejection = { callId: requestedCallId, toContractId: signal.contractId, reason: 'invalid-call-id' };
    const call = await models_1.MediaCalls.findOneByIdOrCallerRequestedId(requestedCallId, caller);
    if (!call) {
        return null;
    }
    // if the requested id matches a real call id, we block it to avoid any potential issues as the requestedId is not expected to ever be an actual call id.
    // if the call is already over, we treat it as an invalid id since it can't be reused
    if (call._id === requestedCallId || call.state === 'hangup') {
        invalidCallId(uid, rejection);
    }
    const isMutatedCallee = call.callee.type === callee.type && call.callee.id === callee.id;
    const isOriginalCallee = call.callee.type === originalCallee.type && call.callee.id === originalCallee.id;
    const isSameCallee = isMutatedCallee || isOriginalCallee;
    const isSameContract = call.caller.contractId === signal.contractId;
    if (!isSameCallee || !isSameContract) {
        invalidCallId(uid, { ...rejection, reason: 'existing-call-id' });
    }
    if (signal.supportedServices?.length && !signal.supportedServices.includes(call.service)) {
        invalidCallId(uid, { ...rejection, reason: 'unsupported' });
    }
    // if the call is already accepted, we won't send its signals again
    if (['active'].includes(call.state)) {
        invalidCallId(uid, { ...rejection, reason: 'already-requested' });
    }
    (0, signalHandler_1.sendSignal)(uid, {
        callId: call._id,
        type: 'new',
        service: call.service,
        kind: call.kind,
        role: 'caller',
        contact: {
            ...call.callee,
        },
        requestedCallId: signal.callId,
    });
    return call;
}
async function processNewCallSignal(signal, uid) {
    console.log('processNewCallSignal');
    const caller = { type: 'user', id: uid };
    const callee = await (0, mutateCallee_1.mutateCallee)(signal.callee);
    const existingCall = await getExistingCall(uid, signal, callee);
    if (existingCall) {
        return;
    }
    const services = signal.supportedServices ?? [];
    const requestedService = services.includes('webrtc') ? 'webrtc' : services.shift();
    try {
        await (0, createCall_1.createCall)({
            caller: {
                ...caller,
                contractId: signal.contractId,
            },
            callee: await (0, mutateCallee_1.mutateCallee)(signal.callee),
            requestedCallId: signal.callId,
            ...(requestedService && { requestedService }),
        });
    }
    catch (e) {
        void (0, signalHandler_1.sendSignal)(uid, {
            type: 'rejected-call-request',
            callId: signal.callId,
            toContractId: signal.contractId,
            reason: 'unsupported',
        }).catch(() => null);
        throw e;
    }
}
//# sourceMappingURL=processNewCallSignal.js.map