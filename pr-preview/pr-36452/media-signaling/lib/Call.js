var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Emitter } from '@rocket.chat/emitter';
import { signalTypeRequiresTargeting } from './utils/signalTypeRequiresTargeting';
export class ClientMediaCall {
    get role() {
        return this._role;
    }
    get state() {
        return this._state;
    }
    get ignored() {
        return this._ignored;
    }
    get contact() {
        return this._contact;
    }
    get service() {
        return this._service;
    }
    // private timeoutHandler?: ReturnType<typeof setTimeout>;
    constructor(config, signal, { ignored, contact } = {}) {
        this.emitter = new Emitter();
        this.firstSignal = signal;
        this.transporter = config.transporter;
        this.webrtcProcessor = config.webrtcProcessor;
        this.callId = signal.callId;
        this._role = signal.body.role;
        this._service = signal.body.service;
        this.acceptedLocally = false;
        this.endedLocally = false;
        this._state = 'none';
        this._ignored = ignored || false;
        this._contact = contact || null;
        this.initialize(this.firstSignal);
    }
    getRemoteMediaStream() {
        return this.webrtcProcessor.getRemoteMediaStream();
    }
    setContact(contact) {
        if (!contact) {
            return;
        }
        this._contact = Object.assign(Object.assign({}, this._contact), contact);
        this.emitter.emit('contactUpdate');
    }
    processSignal(signal) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('ClientMediaCall.processSignal', signal.type);
            if (!signal.sessionId && signalTypeRequiresTargeting(signal.type)) {
                console.error(`Received an untargeted ${signal.type} signal.`);
                return;
            }
            switch (signal.type) {
                case 'sdp':
                    return this.processRemoteSDP(signal);
                case 'request-offer':
                    return this.processOfferRequest(signal);
                case 'notification':
                    return this.processNotification(signal);
            }
            console.log('signal ignored, as its type is not handled by this agent', signal.type);
        });
    }
    accept() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('call.accept');
            if (!this.isPendingAcceptance()) {
                throw new Error('call-not-pending-acceptance');
            }
            this.acceptedLocally = true;
            this.transporter.answer(this.callId, 'accept');
        });
    }
    reject() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('call.reject');
            if (!this.isPendingAcceptance()) {
                throw new Error('call-not-pending-acceptance');
            }
            this.transporter.answer(this.callId, 'reject');
        });
    }
    hangup() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('call.hangup');
            if (this.endedLocally || this._state === 'hangup') {
                return;
            }
            this.endedLocally = true;
            yield this.flagAsEnded('normal');
        });
    }
    isPendingAcceptance() {
        return ['none', 'ringing'].includes(this._state);
    }
    initialize(signal) {
        console.log('call.initialize');
        // If it's flagged as ignored even before the initialization, tell the server we're unavailable
        if (this.ignored) {
            return this.transporter.answer(signal.callId, 'unavailable');
        }
        // If the call is targeted, assume we already accepted it:
        if (signal.sessionId) {
            this.acceptedLocally = true;
        }
        this._state = 'ringing';
        // Send an ACK so the server knows that this session exists and is reachable
        this.transporter.answer(signal.callId, 'ack');
    }
    changeState(newState) {
        if (newState === this._state) {
            return;
        }
        console.log('call.changeState', newState);
        const oldState = this._state;
        this._state = newState;
        this.emitter.emit('stateChange', oldState);
        switch (newState) {
            case 'accepted':
                this.emitter.emit('accepted');
                break;
            case 'hangup':
                this.emitter.emit('ended');
                break;
        }
    }
    processOfferRequest(signal) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('call.processOfferRequest');
            if (!signal.sessionId) {
                console.error('Received an untargeted offer request.');
                return;
            }
            let offer = null;
            try {
                offer = yield this.webrtcProcessor.createOffer(signal.body);
            }
            catch (e) {
                this.transporter.sendError(this.callId, 'failed-to-create-offer');
                throw e;
            }
            if (!offer) {
                this.transporter.sendError(this.callId, 'implementation-error');
            }
            yield this.deliverSdp(offer);
        });
    }
    processAnswerRequest(signal) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Call.processAnswerRequest');
            let answer = null;
            try {
                answer = yield this.webrtcProcessor.createAnswer(signal.body);
            }
            catch (e) {
                this.transporter.sendError(this.callId, 'failed-to-create-answer');
                throw e;
            }
            if (!answer) {
                this.transporter.sendError(this.callId, 'implementation-error');
            }
            yield this.deliverSdp(answer);
        });
    }
    processRemoteSDP(signal) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Call.processRemoteSDP');
            if (signal.body.sdp.type === 'offer') {
                return this.processAnswerRequest(signal);
            }
            yield this.webrtcProcessor.setRemoteDescription(signal.body);
        });
    }
    deliverSdp(sdp) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Call.deliverSdp');
            return this.transporter.sendToServer(this.callId, 'sdp', sdp);
        });
    }
    processNotification(signal) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Call.processNotification', signal.body.notification);
            switch (signal.body.notification) {
                case 'accepted':
                    return this.flagAsAccepted();
                case 'hangup':
                    return this.flagAsEnded('remote');
            }
            console.log('notification ignored as its type is not handled by this agent', signal.body.notification);
        });
    }
    flagAsAccepted() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('flagAsAccepted');
            if (!this.acceptedLocally) {
                this.transporter.sendError(this.callId, 'not-accepted');
                throw new Error('Trying to activate a call that was not yet accepted locally.');
            }
            // Both sides of the call have accepted it, we can change the state now
            this.changeState('accepted');
        });
    }
    flagAsEnded(reasonCode) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('flagAsEnded');
            if (this._state === 'hangup') {
                return;
            }
            this.transporter.hangup(this.callId, reasonCode);
            this.changeState('hangup');
        });
    }
}
//# sourceMappingURL=Call.js.map