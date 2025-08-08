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
import { createRandomToken } from './utils/createRandomToken';
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
        this._userId = config.userId;
        this._sessionId = createRandomToken(8);
        this.knownCalls = new Map();
        this.ignoredCalls = new Set();
        this.transporter = new MediaSignalTransportWrapper(this._sessionId, config.transport);
    }
    isBusy() {
        const call = this.getMainCall();
        if (!call) {
            return false;
        }
        return ['accepted', 'active'].includes(call.state);
    }
    getCallData(callId) {
        return this.knownCalls.get(callId) || null;
    }
    getMainCall() {
        let ringingCall = null;
        let pendingCall = null;
        for (const call of this.knownCalls.values()) {
            if (['accepted', 'active'].includes(call.state)) {
                return call;
            }
            if (call.state === 'ringing' && !ringingCall) {
                ringingCall = call;
                continue;
            }
            if (call.state === 'none') {
                pendingCall = call;
                continue;
            }
        }
        return ringingCall || pendingCall;
    }
    processSignal(signal) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isSignalTargetingAnotherSession(signal) || this.isCallIgnored(signal.callId)) {
                return;
            }
            const call = yield this.getOrCreateCallBySignal(signal);
            yield call.processSignal(signal);
        });
    }
    startCall(calleeType, calleeId, contactInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            const callId = this.createTemporaryCallId();
            const call = yield this.createCall(callId);
            yield call.requestCall({ type: calleeType, id: calleeId }, contactInfo);
        });
    }
    createTemporaryCallId() {
        const callId = createRandomToken(20);
        if (this.knownCalls.has(callId)) {
            return this.createTemporaryCallId();
        }
        return callId;
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
        this.ignoredCalls.add(callId);
        if (this.knownCalls.has(callId)) {
            this.knownCalls.delete(callId);
        }
    }
    getOrCreateCall(callId, localCallId) {
        return __awaiter(this, void 0, void 0, function* () {
            const existingCall = this.knownCalls.get(callId);
            if (existingCall) {
                return existingCall;
            }
            const localCall = localCallId && this.knownCalls.get(localCallId);
            if (localCall) {
                this.knownCalls.set(callId, localCall);
                return localCall;
            }
            return this.createCall(callId);
        });
    }
    getOrCreateCallBySignal(signal) {
        return __awaiter(this, void 0, void 0, function* () {
            if (signal.type === 'new') {
                return this.getOrCreateCall(signal.callId, signal.requestedCallId);
            }
            return this.getOrCreateCall(signal.callId);
        });
    }
    createCall(callId) {
        return __awaiter(this, void 0, void 0, function* () {
            const config = {
                transporter: this.transporter,
                processorFactories: this.config.processorFactories,
                mediaStreamFactory: this.config.mediaStreamFactory,
            };
            const call = new ClientMediaCall(config, callId);
            this.knownCalls.set(callId, call);
            call.emitter.on('contactUpdate', () => this.emit('callContactUpdate', { call }));
            call.emitter.on('stateChange', (oldState) => this.emit('callStateChange', { call, oldState }));
            call.emitter.on('initialized', () => this.emit('newCall', { call }));
            call.emitter.on('accepted', () => this.emit('acceptedCall', { call }));
            call.emitter.on('ended', () => {
                this.ignoreCall(call.callId);
                this.emit('endedCall', { call });
            });
            return call;
        });
    }
}
//# sourceMappingURL=Session.js.map