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
import { ClientMediaCall } from './Call';
import { MediaSignalTransportWrapper } from './TransportWrapper';
const STATE_REPORT_INTERVAL = 60000;
export class MediaSignalingSession extends Emitter {
    get sessionId() {
        return this._sessionId;
    }
    get userId() {
        return this._userId;
    }
    constructor(config) {
        super();
        this.config = config;
        this.callCount = 0;
        this._userId = config.userId;
        this._sessionId = this.createWeakToken();
        this.recurringStateReportHandler = null;
        this.knownCalls = new Map();
        this.ignoredCalls = new Set();
        this.transporter = new MediaSignalTransportWrapper(this._sessionId, config.transport, config.logger);
        this.register();
        this.enableStateReport(STATE_REPORT_INTERVAL);
    }
    isBusy() {
        const call = this.getMainCall();
        if (!call) {
            return false;
        }
        return ['accepted', 'active'].includes(call.state);
    }
    enableStateReport(interval) {
        this.disableStateReport();
        this.recurringStateReportHandler = setInterval(() => {
            this.reportState();
        }, interval);
    }
    disableStateReport() {
        if (this.recurringStateReportHandler) {
            clearInterval(this.recurringStateReportHandler);
            this.recurringStateReportHandler = null;
        }
    }
    getCallData(callId) {
        return this.knownCalls.get(callId) || null;
    }
    getMainCall() {
        let ringingCall = null;
        let pendingCall = null;
        for (const call of this.knownCalls.values()) {
            if (call.state === 'hangup' || call.ignored) {
                continue;
            }
            if (['accepted', 'active'].includes(call.state)) {
                return call;
            }
            if (call.state === 'ringing' && !ringingCall) {
                ringingCall = call;
                continue;
            }
            if (call.state === 'none' && !pendingCall) {
                pendingCall = call;
                continue;
            }
        }
        return ringingCall || pendingCall;
    }
    processSignal(signal) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            (_a = this.config.logger) === null || _a === void 0 ? void 0 : _a.debug('MediaSignalingSession.processSignal', signal);
            if (this.isSignalTargetingAnotherSession(signal) || this.isCallIgnored(signal.callId)) {
                return;
            }
            const call = this.getOrCreateCallBySignal(signal);
            if (signal.type === 'notification' && signal.signedContractId) {
                if (signal.signedContractId === this._sessionId) {
                    call.setContractState('signed');
                }
                else if (signal.notification === 'accepted') {
                    // The server accepted a contract, but it wasn't ours - ignore the call in this session
                    call.setContractState('ignored');
                }
            }
            yield call.processSignal(signal);
        });
    }
    startCall(calleeType, calleeId, contactInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            (_a = this.config.logger) === null || _a === void 0 ? void 0 : _a.debug('MediaSignalingSession.startCall', calleeId);
            const callId = this.createTemporaryCallId();
            const call = this.createCall(callId);
            yield call.requestCall({ type: calleeType, id: calleeId }, contactInfo);
        });
    }
    createTemporaryCallId() {
        this.callCount++;
        return `${this._sessionId}-${this.callCount}-${Date.now()}`;
    }
    isSignalTargetingAnotherSession(signal) {
        if (signal.type === 'new' || signal.type === 'notification') {
            return false;
        }
        if (signal.toContractId && signal.toContractId !== this._sessionId) {
            return true;
        }
        return false;
    }
    isCallIgnored(callId) {
        return this.ignoredCalls.has(callId);
    }
    ignoreCall(callId) {
        var _a;
        (_a = this.config.logger) === null || _a === void 0 ? void 0 : _a.debug('MediaSignalingSession.ignoreCall', callId);
        this.ignoredCalls.add(callId);
        if (this.knownCalls.has(callId)) {
            const call = this.knownCalls.get(callId);
            this.knownCalls.delete(callId);
            call === null || call === void 0 ? void 0 : call.ignore();
        }
    }
    getExistingCallBySignal(signal) {
        const existingCall = this.knownCalls.get(signal.callId);
        if (existingCall) {
            return existingCall;
        }
        if (signal.type === 'new' && signal.requestedCallId) {
            const localCall = this.knownCalls.get(signal.requestedCallId);
            if (localCall) {
                this.knownCalls.set(signal.callId, localCall);
                return localCall;
            }
        }
        return null;
    }
    getOrCreateCallBySignal(signal) {
        var _a;
        (_a = this.config.logger) === null || _a === void 0 ? void 0 : _a.debug('MediaSignalingSession.getOrCreateCallBySignal', signal);
        const existingCall = this.getExistingCallBySignal(signal);
        if (existingCall) {
            return existingCall;
        }
        return this.createCall(signal.callId);
    }
    reportState() {
        const call = this.getMainCall();
        if (call && !call.isOver()) {
            call.reportStates();
            return;
        }
        // If we don't have any call to report the state on, send a register signal instead; the server will ignore it if there's nothing on that side either
        this.register();
    }
    register() {
        this.transporter.sendSignal(Object.assign({ type: 'register', contractId: this._sessionId }, (this.config.oldSessionId && { oldContractId: this.config.oldSessionId })));
    }
    createCall(callId) {
        var _a;
        (_a = this.config.logger) === null || _a === void 0 ? void 0 : _a.debug('MediaSignalingSession.createCall');
        const config = {
            logger: this.config.logger,
            transporter: this.transporter,
            processorFactories: this.config.processorFactories,
            mediaStreamFactory: this.config.mediaStreamFactory,
        };
        const call = new ClientMediaCall(config, callId);
        this.knownCalls.set(callId, call);
        call.emitter.on('contactUpdate', () => this.onCallContactUpdate(call));
        call.emitter.on('stateChange', (oldState) => this.onCallStateChange(call, oldState));
        call.emitter.on('clientStateChange', (oldState) => this.onCallClientStateChange(call, oldState));
        call.emitter.on('initialized', () => this.onNewCall(call));
        call.emitter.on('accepted', () => this.onAcceptedCall(call));
        call.emitter.on('hidden', () => this.onHiddenCall(call));
        call.emitter.on('active', () => this.onActiveCall(call));
        call.emitter.on('ended', () => this.onEndedCall(call));
        return call;
    }
    createWeakToken() {
        const base = 32;
        const size = 8;
        let token = '';
        for (let i = 0; i < size; i++) {
            const r = Math.floor(Math.random() * base);
            token += r.toString(base);
        }
        return `${Date.now()}-${token}`;
    }
    onCallContactUpdate(call) {
        var _a;
        (_a = this.config.logger) === null || _a === void 0 ? void 0 : _a.debug('MediaSignalingSession.onCallContactUpdate');
        if (call.hidden) {
            return;
        }
        this.emit('callContactUpdate', { call });
    }
    onCallStateChange(call, oldState) {
        var _a;
        (_a = this.config.logger) === null || _a === void 0 ? void 0 : _a.debug('MediaSignalingSession.onCallStateChange');
        if (call.hidden && call.state !== 'hangup') {
            return;
        }
        this.emit('callStateChange', { call, oldState });
    }
    onCallClientStateChange(call, oldState) {
        var _a;
        (_a = this.config.logger) === null || _a === void 0 ? void 0 : _a.debug('MediaSignalingSession.onCallClientStateChange');
        if (call.hidden && call.state !== 'hangup') {
            return;
        }
        this.emit('callClientStateChange', { call, oldState });
    }
    onNewCall(call) {
        var _a;
        (_a = this.config.logger) === null || _a === void 0 ? void 0 : _a.debug('MediaSignalingSession.onNewCall');
        if (call.hidden) {
            return;
        }
        this.emit('newCall', { call });
    }
    onAcceptedCall(call) {
        var _a;
        (_a = this.config.logger) === null || _a === void 0 ? void 0 : _a.debug('MediaSignalingSession.onAcceptedCall');
        if (call.hidden) {
            return;
        }
        this.emit('acceptedCall', { call });
    }
    onEndedCall(call) {
        var _a;
        (_a = this.config.logger) === null || _a === void 0 ? void 0 : _a.debug('MediaSignalingSession.onEndedCall');
        this.ignoreCall(call.callId);
        this.emit('endedCall', { call });
    }
    onHiddenCall(call) {
        var _a;
        (_a = this.config.logger) === null || _a === void 0 ? void 0 : _a.debug('MediaSignalingSession.onHiddenCall');
        this.emit('hiddenCall', { call });
    }
    onActiveCall(call) {
        var _a;
        (_a = this.config.logger) === null || _a === void 0 ? void 0 : _a.debug('MediaSignalingSession.onActiveCall');
        this.emit('activeCall', { call });
    }
}
//# sourceMappingURL=Session.js.map