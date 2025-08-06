export class MediaSignalTransportWrapper {
    constructor(contractId, sendSignalFn) {
        this.contractId = contractId;
        this.sendSignalFn = sendSignalFn;
    }
    sendToServer(callId, type, signal) {
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
        console.log('MediaSignalTransport.sendSignal', signal);
        this.sendSignalFn(signal);
    }
}
//# sourceMappingURL=TransportWrapper.js.map