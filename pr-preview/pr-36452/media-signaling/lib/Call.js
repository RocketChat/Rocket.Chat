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
import { mergeContacts } from './utils/mergeContacts';
const TIMEOUT_TO_ACCEPT = 30000;
const TIMEOUT_TO_CONFIRM_ACCEPTANCE = 2000;
const TIMEOUT_TO_PROGRESS_SIGNALING = 10000;
const STATE_REPORT_DELAY = 300;
// if the server tells us we're the caller in a call we don't recognize, ignore it completely
const AUTO_IGNORE_UNKNOWN_OUTBOUND_CALLS = true;
export class ClientMediaCall {
    get callId() {
        var _a;
        return (_a = this.remoteCallId) !== null && _a !== void 0 ? _a : this.localCallId;
    }
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
        return this._contact || {};
    }
    get service() {
        return this._service;
    }
    get signed() {
        return ['signed', 'pre-signed', 'self-signed'].includes(this.contractState);
    }
    get hidden() {
        return this.ignored || this.contractState === 'ignored';
    }
    constructor(config, callId) {
        this.config = config;
        this.webrtcProcessor = null;
        this.emitter = new Emitter();
        this.config.transporter = config.transporter;
        this.localCallId = callId;
        this.remoteCallId = null;
        this.acceptedLocally = false;
        this.endedLocally = false;
        this.hasRemoteData = false;
        this.initialized = false;
        this.acknowledged = false;
        this.contractState = 'proposed';
        this.hasLocalDescription = false;
        this.hasRemoteDescription = false;
        this.serviceStates = new Map();
        this.stateReporterTimeoutHandler = null;
        this.mayReportStates = true;
        this.earlySignals = new Set();
        this.stateTimeoutHandlers = new Set();
        this._role = 'callee';
        this._state = 'none';
        this.oldClientState = 'none';
        this._ignored = false;
        this._contact = null;
        this._service = null;
    }
    // Initialize an outbound call with basic contact information until we receive the full call details from the server;
    // this gets executed once for outbound calls initiated in this session.
    initializeOutboundCall(contact) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (this.acceptedLocally) {
                return;
            }
            (_a = this.config.logger) === null || _a === void 0 ? void 0 : _a.debug('ClientMediaCall.initializeOutboundCall');
            const wasInitialized = this.initialized;
            this.initialized = true;
            this.acceptedLocally = true;
            if (this.hasRemoteData) {
                this.changeContact(contact, { prioritizeExisting: true });
            }
            else {
                this._role = 'caller';
                this._contact = contact;
            }
            this.addStateTimeout('pending', TIMEOUT_TO_ACCEPT);
            if (!wasInitialized) {
                this.emitter.emit('initialized');
            }
        });
    }
    // Initialize an outbound call with the callee information and send a call request to the server
    requestCall(callee, contactInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (this.initialized) {
                return;
            }
            (_a = this.config.logger) === null || _a === void 0 ? void 0 : _a.debug('ClientMediaCall.requestCall', callee);
            this.config.transporter.sendToServer(this.callId, 'request-call', {
                callee,
                supportedServices: Object.keys(this.config.processorFactories),
            });
            return this.initializeOutboundCall(Object.assign(Object.assign({}, contactInfo), callee));
        });
    }
    // initialize a call with the data received from the server on a 'new' signal; this gets executed once for every call
    initializeRemoteCall(signal) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            if (this.hasRemoteData) {
                return;
            }
            (_a = this.config.logger) === null || _a === void 0 ? void 0 : _a.debug('ClientMediaCall.initializeRemoteCall', signal);
            this.remoteCallId = signal.callId;
            const wasInitialized = this.initialized;
            this.initialized = true;
            this.hasRemoteData = true;
            this._service = signal.service;
            this._role = signal.role;
            this.changeContact(signal.contact);
            if (this._role === 'caller' && !this.acceptedLocally && AUTO_IGNORE_UNKNOWN_OUTBOUND_CALLS) {
                (_b = this.config.logger) === null || _b === void 0 ? void 0 : _b.log('Ignoring Unknown Outbound Call');
                this.ignore();
            }
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
            // If the call was requested by this specific session, assume we're signed already.
            if (this._role === 'caller' && this.acceptedLocally && signal.requestedCallId === this.localCallId) {
                this.contractState = 'pre-signed';
            }
            if (!wasInitialized) {
                this.emitter.emit('initialized');
            }
            yield this.processEarlySignals();
        });
    }
    getClientState() {
        if (this.isOver()) {
            return 'hangup';
        }
        if (this.hidden) {
            return 'busy-elsewhere';
        }
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
            default:
                return this._state;
        }
    }
    getRemoteMediaStream() {
        var _a;
        (_a = this.config.logger) === null || _a === void 0 ? void 0 : _a.debug('ClientMediaCall.getRemoteMediaStream');
        if (this.shouldIgnoreWebRTC()) {
            this.throwError('getRemoteMediaStream is not available for this service');
        }
        this.prepareWebRtcProcessor();
        return this.webrtcProcessor.getRemoteMediaStream();
    }
    processSignal(signal) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            if (this.isOver()) {
                return;
            }
            (_a = this.config.logger) === null || _a === void 0 ? void 0 : _a.debug('ClientMediaCall.processSignal', signal);
            const { type: signalType } = signal;
            if (signalType === 'new') {
                return this.initializeRemoteCall(signal);
            }
            if (!this.hasRemoteData) {
                (_b = this.config.logger) === null || _b === void 0 ? void 0 : _b.debug('Remote data missing, adding signal to queue');
                this.earlySignals.add(signal);
                return;
            }
            switch (signalType) {
                case 'remote-sdp':
                    return this.processRemoteSDP(signal);
                case 'request-offer':
                    return this.processOfferRequest(signal);
                case 'notification':
                    return this.processNotification(signal);
            }
        });
    }
    accept() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            (_a = this.config.logger) === null || _a === void 0 ? void 0 : _a.debug('ClientMediaCall.accept');
            if (!this.isPendingOurAcceptance()) {
                this.throwError('call-not-pending-acceptance');
            }
            if (!this.hasRemoteData) {
                this.throwError('missing-remote-data');
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
            var _a;
            (_a = this.config.logger) === null || _a === void 0 ? void 0 : _a.debug('ClientMediaCall.reject');
            if (!this.isPendingOurAcceptance()) {
                this.throwError('call-not-pending-acceptance');
            }
            if (!this.hasRemoteData) {
                this.throwError('missing-remote-data');
            }
            this.config.transporter.answer(this.callId, 'reject');
            this.changeState('hangup');
        });
    }
    hangup() {
        return __awaiter(this, arguments, void 0, function* (reason = 'normal') {
            var _a;
            (_a = this.config.logger) === null || _a === void 0 ? void 0 : _a.debug('ClientMediaCall.hangup', reason);
            if (this.endedLocally || this._state === 'hangup') {
                return;
            }
            if (this.hidden) {
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
        if (this._role !== 'callee' || this.acceptedLocally) {
            return false;
        }
        if (this.hidden) {
            return false;
        }
        return this.isPendingAcceptance();
    }
    isOver() {
        return this._state === 'hangup';
    }
    ignore() {
        var _a;
        if (this.ignored) {
            return;
        }
        const { hidden: wasHidden } = this;
        (_a = this.config.logger) === null || _a === void 0 ? void 0 : _a.debug('ClientMediaCall.ignore');
        this._ignored = true;
        if (this.hidden && !wasHidden) {
            this.emitter.emit('hidden');
        }
        this.updateClientState();
        this.reportStates();
        this.mayReportStates = false;
    }
    setContractState(state) {
        var _a, _b, _c;
        if (this.contractState === state) {
            return;
        }
        (_a = this.config.logger) === null || _a === void 0 ? void 0 : _a.debug('ClientMediaCall.setContractState', `${this.contractState} => ${state}`);
        if (['pre-signed', 'self-signed'].includes(this.contractState) && state === 'signed') {
            this.contractState = state;
            return;
        }
        if (this.contractState !== 'proposed') {
            this.reportStates();
        }
        if (this.contractState === 'signed') {
            if (state === 'ignored') {
                (_b = this.config.logger) === null || _b === void 0 ? void 0 : _b.error('[Media Signal] Trying to ignore a contract that was already signed.');
            }
            return;
        }
        if (this.contractState === 'pre-signed' && state === 'ignored') {
            (_c = this.config.logger) === null || _c === void 0 ? void 0 : _c.error('[Media Signal] Our self signed contract was ignored.');
        }
        const { hidden: wasHidden } = this;
        this.contractState = state;
        if (this.hidden && !wasHidden) {
            this.emitter.emit('hidden');
        }
    }
    changeState(newState) {
        var _a;
        if (newState === this._state) {
            return;
        }
        (_a = this.config.logger) === null || _a === void 0 ? void 0 : _a.debug('ClientMediaCall.changeState', `${this._state} => ${newState}`);
        const oldState = this._state;
        this._state = newState;
        this.updateClientState();
        this.emitter.emit('stateChange', oldState);
        this.requestStateReport();
        switch (newState) {
            case 'accepted':
                this.emitter.emit('accepted');
                break;
            case 'hangup':
                this.emitter.emit('ended');
                break;
        }
    }
    updateClientState() {
        var _a;
        const { oldClientState } = this;
        const clientState = this.getClientState();
        if (clientState === oldClientState) {
            return;
        }
        (_a = this.config.logger) === null || _a === void 0 ? void 0 : _a.debug('ClientMediaCall.updateClientState', `${oldClientState} => ${clientState}`);
        this.updateStateTimeouts();
        this.requestStateReport();
        this.oldClientState = clientState;
        this.emitter.emit('clientStateChange', oldClientState);
    }
    changeContact(contact, { prioritizeExisting } = {}) {
        var _a;
        (_a = this.config.logger) === null || _a === void 0 ? void 0 : _a.debug('ClientMediaCall.changeContact');
        const oldContct = prioritizeExisting ? contact : this._contact;
        const newContact = prioritizeExisting ? this._contact : contact;
        this._contact = mergeContacts(oldContct, newContact);
        if (this._contact) {
            this.emitter.emit('contactUpdate');
        }
    }
    processOfferRequest(signal) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            (_a = this.config.logger) === null || _a === void 0 ? void 0 : _a.debug('ClientMediaCall.processOfferRequest', signal);
            if (!signal.toContractId && !this.signed) {
                (_b = this.config.logger) === null || _b === void 0 ? void 0 : _b.error('Received an unsigned offer request.');
                return;
            }
            if (this.shouldIgnoreWebRTC()) {
                this.sendError('invalid-service');
                return;
            }
            this.requireWebRTC();
            let offer = null;
            try {
                offer = yield this.webrtcProcessor.createOffer(signal);
            }
            catch (e) {
                this.sendError('failed-to-create-offer');
                throw e;
            }
            if (!offer) {
                this.sendError('implementation-error');
            }
            yield this.deliverSdp(offer);
        });
    }
    shouldIgnoreWebRTC() {
        if (this.hasRemoteData) {
            return this.service !== 'webrtc';
        }
        // If we called and we don't support webrtc, assume it's not gonna be a webrtc call
        if (this._role === 'caller' && !this.config.processorFactories.webrtc) {
            return true;
        }
        // With no more info, we can't safely ignore webrtc
        return false;
    }
    processAnswerRequest(signal) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (this.shouldIgnoreWebRTC()) {
                return;
            }
            (_a = this.config.logger) === null || _a === void 0 ? void 0 : _a.debug('ClientMediaCall.processAnswerRequest', signal);
            this.requireWebRTC();
            let answer = null;
            try {
                answer = yield this.webrtcProcessor.createAnswer(signal);
            }
            catch (e) {
                this.sendError('failed-to-create-answer');
                throw e;
            }
            if (!answer) {
                this.sendError('implementation-error');
                return;
            }
            this.hasRemoteDescription = true;
            yield this.deliverSdp(answer);
        });
    }
    sendError(errorCode) {
        var _a;
        (_a = this.config.logger) === null || _a === void 0 ? void 0 : _a.debug('ClientMediaCall.sendError', errorCode);
        if (this.hidden) {
            return;
        }
        this.config.transporter.sendError(this.callId, errorCode);
    }
    processRemoteSDP(signal) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            (_a = this.config.logger) === null || _a === void 0 ? void 0 : _a.debug('ClientMediaCall.processRemoteSDP', signal);
            if (this.hidden) {
                return;
            }
            if (!signal.toContractId && !this.signed) {
                (_b = this.config.logger) === null || _b === void 0 ? void 0 : _b.error('Received an unsigned SDP signal');
                return;
            }
            if (this.shouldIgnoreWebRTC()) {
                return;
            }
            this.requireWebRTC();
            if (signal.sdp.type === 'offer') {
                return this.processAnswerRequest(signal);
            }
            yield this.webrtcProcessor.setRemoteDescription(signal);
            this.hasRemoteDescription = true;
        });
    }
    deliverSdp(data) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            (_a = this.config.logger) === null || _a === void 0 ? void 0 : _a.debug('ClientMediaCall.deliverSdp');
            this.hasLocalDescription = true;
            if (!this.hidden) {
                this.config.transporter.sendToServer(this.callId, 'local-sdp', data);
            }
            this.updateClientState();
        });
    }
    rejectAsUnavailable() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            (_a = this.config.logger) === null || _a === void 0 ? void 0 : _a.debug('ClientMediaCall.rejectAsUnavailable');
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
            var _d, _e;
            (_d = this.config.logger) === null || _d === void 0 ? void 0 : _d.debug('ClientMediaCall.processEarlySignals');
            const earlySignals = this.earlySignals.values().toArray();
            this.earlySignals.clear();
            try {
                for (var _f = true, earlySignals_1 = __asyncValues(earlySignals), earlySignals_1_1; earlySignals_1_1 = yield earlySignals_1.next(), _a = earlySignals_1_1.done, !_a; _f = true) {
                    _c = earlySignals_1_1.value;
                    _f = false;
                    const signal = _c;
                    try {
                        yield this.processSignal(signal);
                    }
                    catch (e) {
                        (_e = this.config.logger) === null || _e === void 0 ? void 0 : _e.error('Error processing early signal', e);
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (!_f && !_a && (_b = earlySignals_1.return)) yield _b.call(earlySignals_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
        });
    }
    acknowledge() {
        var _a;
        if (this.acknowledged || this.hidden) {
            return;
        }
        (_a = this.config.logger) === null || _a === void 0 ? void 0 : _a.debug('ClientMediaCall.acknowledge');
        this.acknowledged = true;
        this.config.transporter.answer(this.callId, 'ack');
        if (this._state === 'none') {
            this.changeState('ringing');
        }
    }
    processNotification(signal) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            (_a = this.config.logger) === null || _a === void 0 ? void 0 : _a.debug('ClientMediaCall.processNotification');
            switch (signal.notification) {
                case 'accepted':
                    return this.flagAsAccepted();
                case 'hangup':
                    return this.flagAsEnded('remote');
            }
        });
    }
    flagAsAccepted() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            (_a = this.config.logger) === null || _a === void 0 ? void 0 : _a.debug('ClientMediaCall.flagAsAccepted');
            // If hidden, just move the state without doing anything
            if (this.hidden) {
                this.changeState('accepted');
                return;
            }
            if (!this.acceptedLocally) {
                // #ToDo: test this situation; remove exception, read this response on the server
                this.config.transporter.sendError(this.callId, 'not-accepted');
                this.throwError('Trying to activate a call that was not yet accepted locally.');
            }
            if (this.contractState === 'proposed') {
                this.contractState = 'self-signed';
            }
            // Both sides of the call have accepted it, we can change the state now
            this.changeState('accepted');
            this.addStateTimeout('accepted', TIMEOUT_TO_PROGRESS_SIGNALING);
            this.addStateTimeout('has-offer', TIMEOUT_TO_PROGRESS_SIGNALING);
        });
    }
    flagAsEnded(reason) {
        var _a;
        (_a = this.config.logger) === null || _a === void 0 ? void 0 : _a.debug('ClientMediaCall.flagAsEnded', reason);
        if (this._state === 'hangup') {
            return;
        }
        if (!this.hidden) {
            this.config.transporter.hangup(this.callId, reason);
        }
        this.changeState('hangup');
    }
    addStateTimeout(state, timeout, callback) {
        var _a;
        (_a = this.config.logger) === null || _a === void 0 ? void 0 : _a.debug('ClientMediaCall.addStateTimeout', state, `${timeout / 1000}s`);
        if (this.getClientState() !== state) {
            return;
        }
        // Do not set state timeouts if the call is not happening on this session, unless there's a callback attached to that timeout
        if (this.hidden && !callback) {
            return;
        }
        const handler = {
            state,
            handler: setTimeout(() => {
                if (this.stateTimeoutHandlers.has(handler)) {
                    this.stateTimeoutHandlers.delete(handler);
                }
                if (state !== this.getClientState()) {
                    return;
                }
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
        var _a;
        (_a = this.config.logger) === null || _a === void 0 ? void 0 : _a.debug('ClientMediaCall.updateStateTimeouts');
        const clientState = this.getClientState();
        for (const handler of this.stateTimeoutHandlers.values()) {
            if (handler.state === clientState) {
                continue;
            }
            clearTimeout(handler.handler);
            this.stateTimeoutHandlers.delete(handler);
        }
    }
    onWebRTCInternalStateChange(stateName) {
        var _a;
        (_a = this.config.logger) === null || _a === void 0 ? void 0 : _a.debug('ClientMediaCall.onWebRTCInternalStateChange');
        if (!this.webrtcProcessor) {
            return;
        }
        const stateValue = this.webrtcProcessor.getInternalState(stateName);
        if (this.serviceStates.get(stateName) !== stateValue) {
            this.serviceStates.set(stateName, stateValue);
            this.requestStateReport();
        }
    }
    reportStates() {
        var _a;
        (_a = this.config.logger) === null || _a === void 0 ? void 0 : _a.debug('ClientMediaCall.reportStates');
        this.clearStateReporter();
        if (!this.mayReportStates) {
            return;
        }
        this.config.transporter.sendToServer(this.callId, 'local-state', {
            callState: this.state,
            clientState: this.getClientState(),
            serviceStates: Object.fromEntries(this.serviceStates.entries()),
            ignored: this.ignored,
            contractState: this.contractState,
        });
        if (this.state === 'hangup') {
            this.mayReportStates = false;
        }
    }
    clearStateReporter() {
        var _a;
        (_a = this.config.logger) === null || _a === void 0 ? void 0 : _a.debug('ClientMediaCall.clearStateReporter');
        if (this.stateReporterTimeoutHandler) {
            clearTimeout(this.stateReporterTimeoutHandler);
            this.stateReporterTimeoutHandler = null;
        }
    }
    requestStateReport() {
        var _a;
        (_a = this.config.logger) === null || _a === void 0 ? void 0 : _a.debug('ClientMediaCall.requestStateReport');
        this.clearStateReporter();
        if (!this.mayReportStates) {
            return;
        }
        this.stateReporterTimeoutHandler = setTimeout(() => {
            this.reportStates();
        }, STATE_REPORT_DELAY);
    }
    throwError(error) {
        var _a;
        (_a = this.config.logger) === null || _a === void 0 ? void 0 : _a.error(error);
        throw new Error(error);
    }
    prepareWebRtcProcessor() {
        var _a;
        (_a = this.config.logger) === null || _a === void 0 ? void 0 : _a.debug('ClientMediaCall.prepareWebRtcProcessor');
        if (this.webrtcProcessor) {
            return;
        }
        const { mediaStreamFactory, logger, processorFactories: { webrtc: webrtcFactory }, } = this.config;
        if (!webrtcFactory) {
            this.throwError('webrtc-not-implemented');
        }
        this.webrtcProcessor = webrtcFactory({ mediaStreamFactory, logger });
        this.webrtcProcessor.emitter.on('internalStateChange', (stateName) => this.onWebRTCInternalStateChange(stateName));
    }
    requireWebRTC() {
        try {
            this.prepareWebRtcProcessor();
        }
        catch (e) {
            this.sendError('webrtc-not-implemented');
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