export class MediaSignalTransportWrapper {
    constructor(contractId, sendSignalFn, logger) {
        this.contractId = contractId;
        this.sendSignalFn = sendSignalFn;
        this.logger = logger;
    }
    sendToServer(callId, type, signal) {
        var _a;
        (_a = this.logger) === null || _a === void 0 ? void 0 : _a.debug('MediaSignalTransportWrapper.sendToServer', type);
        return this.sendSignal(Object.assign({ callId, contractId: this.contractId, type }, signal));
    }
    sendError(callId, errorCode) {
        this.sendToServer(callId, 'error', { errorCode });
    }
    answer(callId, answer) {
        return this.sendToServer(callId, 'answer', { answer });
    }
    hangup(callId, reason) {
        return this.sendToServer(callId, 'hangup', { reason });
    }
    sendSignal(signal) {
        var _a;
        (_a = this.logger) === null || _a === void 0 ? void 0 : _a.debug('MediaSignalTransportWrapper.sendSignal', signal);
        this.sendSignalFn(signal);
    }
}
//# sourceMappingURL=TransportWrapper.js.map