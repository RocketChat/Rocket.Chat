export class MediaSignalTransportWrapper {
    constructor(sessionId, sendSignalFn) {
        this.sessionId = sessionId;
        this.sendSignalFn = sendSignalFn;
    }
    sendToServer(callId, type, body) {
        return this.sendSignalToServer(callId, {
            type,
            body,
        });
    }
    sendError(callId, errorCode) {
        this.sendToServer(callId, 'error', {
            errorCode,
        });
    }
    answer(callId, answer) {
        return this.sendToServer(callId, 'answer', { answer });
    }
    hangup(callId, reason) {
        return this.sendToServer(callId, 'hangup', { reason });
    }
    notify(callId, notification) {
        return this.sendToServer(callId, 'notification', { notification });
    }
    sendSignalToServer(callId, signal) {
        return this.sendSignal(Object.assign(Object.assign({}, signal), { callId, sessionId: this.sessionId }));
    }
    sendSignal(signal) {
        console.log('MediaSignalTransport.sendSignal', signal);
        this.sendSignalFn(signal);
    }
}
//# sourceMappingURL=TransportWrapper.js.map