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
const stateWeights = {
    none: 0,
    ringing: 1,
    accepted: 2,
    active: 3,
    hangup: -1,
};
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
        return this.hasAnyCallState(['ringing', 'accepted', 'active']);
    }
    getCallData(callId) {
        return this.knownCalls.get(callId) || null;
    }
    getAllCallStates() {
        return this.knownCalls
            .values()
            .map(({ state }) => state)
            .toArray();
    }
    hasAnyCallState(states) {
        const knownStates = this.getAllCallStates();
        for (const state of knownStates) {
            if (states.includes(state)) {
                return true;
            }
        }
        return false;
    }
    getSortedCalls() {
        return this.knownCalls
            .values()
            .toArray()
            .sort((call1, call2) => {
            const call1Weight = stateWeights[call1.state] || 0;
            const call2Weight = stateWeights[call2.state] || 0;
            return call2Weight - call1Weight;
        });
    }
    getMainCall() {
        const call = this.getSortedCalls().pop();
        if (call) {
            return this.getCallData(call.callId);
        }
        return null;
    }
    processSignal(signal) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('session.processSignal', signal.type);
            if (this.isSignalTargetingAnotherSession(signal) || this.isCallIgnored(signal.callId)) {
                return;
            }
            const call = yield this.getOrCreateCall(signal.callId);
            yield call.processSignal(signal);
        });
    }
    registerOutboundCall(callId, contact) {
        return __awaiter(this, void 0, void 0, function* () {
            const call = yield this.getOrCreateCall(callId);
            return call.initializeOutboundCall(contact);
        });
    }
    isSignalTargetingAnotherSession(signal) {
        if (!signal.sessionId) {
            return false;
        }
        return signal.sessionId !== this._sessionId;
    }
    isCallIgnored(callId) {
        return this.ignoredCalls.has(callId);
    }
    getOrCreateCall(callId) {
        return __awaiter(this, void 0, void 0, function* () {
            const existingCall = this.knownCalls.get(callId);
            if (existingCall) {
                return existingCall;
            }
            const config = {
                transporter: this.transporter,
                processorFactories: this.config.processorFactories,
                mediaStreamFactory: this.config.mediaStreamFactory,
            };
            const call = new ClientMediaCall(config, callId);
            this.knownCalls.set(callId, call);
            call.emitter.on('stateChange', (oldState) => this.emit('callStateChange', { call, oldState }));
            call.emitter.on('accepted', () => this.emit('acceptedCall', { call }));
            call.emitter.on('ended', () => {
                this.ignoredCalls.add(call.callId);
                this.emit('endedCall', { call });
            });
            this.emit('newCall', { call });
            return call;
        });
    }
}
//# sourceMappingURL=Session.js.map