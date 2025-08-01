var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
import { Emitter } from '@rocket.chat/emitter';
import { signalTypeRequiresTargeting } from './utils/signalTypeRequiresTargeting';
const TIMEOUT_TO_ACCEPT = 30000;
const TIMEOUT_TO_CONFIRM_ACCEPTANCE = 2000;
const TIMEOUT_TO_PROGRESS_SIGNALING = 10000;
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
    constructor(config, callId) {
        this.config = config;
        this.webrtcProcessor = null;
        this.emitter = new Emitter();
        this.config.transporter = config.transporter;
        this.callId = callId;
        this.acceptedLocally = false;
        this.endedLocally = false;
        this.hasRemoteData = false;
        this.acknowledged = false;
        this.hasLocalDescription = false;
        this.hasRemoteDescription = false;
        this.earlySignals = new Set();
        this.stateTimeoutHandlers = new Set();
        this._role = 'callee';
        this._state = 'none';
        this._ignored = false;
        this._contact = null;
        this._service = null;
    }
    initializeOutboundCall(contact) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.acceptedLocally) {
                return;
            }
            if (!this.hasRemoteData) {
                this._role = 'caller';
            }
            this.acceptedLocally = true;
            this._contact = contact;
            this.addStateTimeout('pending', TIMEOUT_TO_ACCEPT);
        });
    }
    initializeRemoteCall(signal) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.hasRemoteData) {
                return;
            }
            console.log('call.initializeRemoteCall', signal.callId);
            this.hasRemoteData = true;
            this._service = signal.body.service;
            this._role = signal.body.role;
            // If it's flagged as ignored even before the initialization, tell the server we're unavailable
            if (this.ignored) {
                return this.rejectAsUnavailable();
            }
            if (this._service === 'webrtc') {
                try {
                    this.prepareWebRtcProcessor();
                }
                catch (e) {
                    yield this.rejectAsUnavailable();
                    throw e;
                }
            }
            // Send an ACK so the server knows that this session exists and is reachable
            this.acknowledge();
            if (this._role === 'callee' || !this.acceptedLocally) {
                this.addStateTimeout('pending', TIMEOUT_TO_ACCEPT);
            }
            yield this.processEarlySignals();
        });
    }
    getClientState() {
        switch (this._state) {
            case 'none':
            case 'ringing':
                if (this.hasRemoteData && this._role === 'callee' && this.acceptedLocally) {
                    return 'accepting';
                }
                return 'pending';
            case 'accepted':
                if (this.hasLocalDescription && this.hasRemoteDescription) {
                    return 'has-answer';
                }
                if (this.hasLocalDescription !== this.hasRemoteDescription) {
                    return 'has-offer';
                }
                return 'accepted';
            case 'active':
                return 'active';
            case 'hangup':
                return 'hangup';
        }
    }
    getRemoteMediaStream() {
        if (this.shouldIgnoreWebRTC()) {
            throw new Error('getRemoteMediaStream is not available for this service');
        }
        this.prepareWebRtcProcessor();
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
            if (this.isOver()) {
                return;
            }
            console.log('ClientMediaCall.processSignal', signal.type);
            if (signal.type === 'new') {
                return this.initializeRemoteCall(signal);
            }
            if (!this.hasRemoteData) {
                this.earlySignals.add(signal);
                return;
            }
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
            if (!this.isPendingOurAcceptance()) {
                throw new Error('call-not-pending-acceptance');
            }
            if (!this.hasRemoteData) {
                throw new Error('missing-remote-data');
            }
            this.acceptedLocally = true;
            this.config.transporter.answer(this.callId, 'accept');
            if (this.getClientState() === 'accepting') {
                this.updateStateTimeouts();
                this.addStateTimeout('accepting', TIMEOUT_TO_CONFIRM_ACCEPTANCE);
                this.emitter.emit('accepting');
            }
        });
    }
    reject() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('call.reject');
            if (!this.isPendingOurAcceptance()) {
                throw new Error('call-not-pending-acceptance');
            }
            if (!this.hasRemoteData) {
                throw new Error('missing-remote-data');
            }
            this.config.transporter.answer(this.callId, 'reject');
            this.changeState('hangup');
        });
    }
    hangup() {
        return __awaiter(this, arguments, void 0, function* (reason = 'normal') {
            console.log('call.hangup');
            if (this.endedLocally || this._state === 'hangup') {
                return;
            }
            this.endedLocally = true;
            this.flagAsEnded(reason);
        });
    }
    isPendingAcceptance() {
        return ['none', 'ringing'].includes(this._state);
    }
    isPendingOurAcceptance() {
        if (this._role !== 'callee') {
            return false;
        }
        if (this.acceptedLocally) {
            return false;
        }
        return this.isPendingAcceptance();
    }
    isOver() {
        return this.ignored || this._state === 'hangup';
    }
    changeState(newState) {
        if (newState === this._state) {
            return;
        }
        console.log('call.changeState', newState);
        const oldState = this._state;
        this._state = newState;
        this.updateStateTimeouts();
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
            if (this.shouldIgnoreWebRTC()) {
                this.config.transporter.sendError(this.callId, 'invalid-service');
                return;
            }
            this.requireWebRTC();
            let offer = null;
            try {
                offer = yield this.webrtcProcessor.createOffer(signal.body);
            }
            catch (e) {
                this.config.transporter.sendError(this.callId, 'failed-to-create-offer');
                throw e;
            }
            if (!offer) {
                this.config.transporter.sendError(this.callId, 'implementation-error');
            }
            yield this.deliverSdp(offer);
        });
    }
    shouldIgnoreWebRTC() {
        // Without the remote data we don't know if the call is using webrtc or not
        return this.hasRemoteData && this._service !== 'webrtc';
    }
    processAnswerRequest(signal) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Call.processAnswerRequest');
            if (this.shouldIgnoreWebRTC()) {
                return;
            }
            this.requireWebRTC();
            let answer = null;
            try {
                answer = yield this.webrtcProcessor.createAnswer(signal.body);
            }
            catch (e) {
                this.config.transporter.sendError(this.callId, 'failed-to-create-answer');
                throw e;
            }
            if (!answer) {
                this.config.transporter.sendError(this.callId, 'implementation-error');
                return;
            }
            this.hasRemoteDescription = true;
            yield this.deliverSdp(answer);
        });
    }
    processRemoteSDP(signal) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Call.processRemoteSDP');
            if (this.shouldIgnoreWebRTC()) {
                return;
            }
            this.requireWebRTC();
            if (signal.body.sdp.type === 'offer') {
                return this.processAnswerRequest(signal);
            }
            yield this.webrtcProcessor.setRemoteDescription(signal.body);
            this.hasRemoteDescription = true;
        });
    }
    deliverSdp(sdp) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Call.deliverSdp');
            this.hasLocalDescription = true;
            return this.config.transporter.sendToServer(this.callId, 'sdp', sdp);
        });
    }
    rejectAsUnavailable() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('call.rejectAsUnavailable');
            // If we have already told the server we accept this call, then we need to send a hangup to get out of it
            if (this.acceptedLocally) {
                return this.hangup('unavailable');
            }
            this.config.transporter.answer(this.callId, 'unavailable');
            this.changeState('hangup');
        });
    }
    processEarlySignals() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, e_1, _b, _c;
            console.log('call.processEarlySignals');
            const earlySignals = this.earlySignals.values().toArray();
            this.earlySignals.clear();
            try {
                for (var _d = true, earlySignals_1 = __asyncValues(earlySignals), earlySignals_1_1; earlySignals_1_1 = yield earlySignals_1.next(), _a = earlySignals_1_1.done, !_a; _d = true) {
                    _c = earlySignals_1_1.value;
                    _d = false;
                    const signal = _c;
                    try {
                        yield this.processSignal(signal);
                    }
                    catch (e) {
                        console.error('Error processing early signal', e);
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (!_d && !_a && (_b = earlySignals_1.return)) yield _b.call(earlySignals_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
        });
    }
    acknowledge() {
        console.log('call.acknowledge');
        if (this.acknowledged) {
            return;
        }
        this.acknowledged = true;
        this.config.transporter.answer(this.callId, 'ack');
        if (this._state === 'none') {
            this.changeState('ringing');
        }
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
                // #ToDo: test this situation; remove exception, read this response on the server
                this.config.transporter.sendError(this.callId, 'not-accepted');
                throw new Error('Trying to activate a call that was not yet accepted locally.');
            }
            // Both sides of the call have accepted it, we can change the state now
            this.changeState('accepted');
            this.addStateTimeout('accepted', TIMEOUT_TO_PROGRESS_SIGNALING);
            this.addStateTimeout('has-offer', TIMEOUT_TO_PROGRESS_SIGNALING);
        });
    }
    flagAsEnded(reason) {
        console.log('flagAsEnded');
        if (this._state === 'hangup') {
            return;
        }
        this.config.transporter.hangup(this.callId, reason);
        this.changeState('hangup');
    }
    addStateTimeout(state, timeout, callback) {
        if (this.getClientState() !== state) {
            return;
        }
        console.log(`adding a timeout of ${timeout / 1000} seconds to the state [${state}]`);
        const handler = {
            state,
            handler: setTimeout(() => {
                if (this.stateTimeoutHandlers.has(handler)) {
                    this.stateTimeoutHandlers.delete(handler);
                }
                if (state !== this.getClientState()) {
                    return;
                }
                console.log(`reached timeout for the [${state}] state.`);
                if (callback) {
                    callback();
                }
                else {
                    void this.hangup('timeout');
                }
            }, timeout),
        };
        this.stateTimeoutHandlers.add(handler);
    }
    updateStateTimeouts() {
        const clientState = this.getClientState();
        for (const handler of this.stateTimeoutHandlers.values()) {
            if (handler.state === clientState) {
                continue;
            }
            clearTimeout(handler.handler);
            this.stateTimeoutHandlers.delete(handler);
        }
    }
    prepareWebRtcProcessor() {
        if (this.webrtcProcessor) {
            return;
        }
        console.log('session.createWebRtcProcessor');
        const { mediaStreamFactory, processorFactories: { webrtc: webrtcFactory }, } = this.config;
        if (!webrtcFactory) {
            throw new Error('webrtc-not-implemented');
        }
        this.webrtcProcessor = webrtcFactory({ mediaStreamFactory });
    }
    requireWebRTC() {
        try {
            this.prepareWebRtcProcessor();
        }
        catch (e) {
            this.config.transporter.sendError(this.callId, 'webrtc-not-implemented');
            throw e;
        }
    }
}
export class ClientMediaCallWebRTC extends ClientMediaCall {
    constructor(config, callId) {
        super(config, callId);
        throw new Error('ClientMediaCallWebRTC is not meant to be constructed.');
    }
}
//# sourceMappingURL=Call.js.map