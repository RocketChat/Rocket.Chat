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
import { isCallRole } from '../definition/call';
const stateWeights = {
    none: 0,
    ringing: 1,
    accepted: 2,
    error: 3,
    active: 4,
    hangup: 0,
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
        this.contactInformation = new Map();
        this.ignoredCalls = new Set();
        this.failedCalls = new Set();
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
            if (this.isSignalTargetingAnotherSession(signal)) {
                return;
            }
            if (this.isCallIgnored(signal.callId)) {
                if (signal.sessionId) {
                    console.error('Received targeted signal for an ignored call.', signal);
                }
                return;
            }
            if (signal.type === 'new') {
                yield this.processNewCall(signal);
                return;
            }
            const call = this.knownCalls.get(signal.callId);
            if (!call) {
                if (this.failedCalls.has(signal.callId)) {
                    // do something?
                    return;
                }
                // #ToDo: Hold on to unexpected untargeted signals for a few seconds and process them if a notifyNew arrives
                console.error('Unexpected Signal', signal);
                throw new Error('Unexpected Signal received.');
            }
            yield call.processSignal(signal);
        });
    }
    getStoredCallContact(callId) {
        var _a;
        return Object.assign(Object.assign({}, this.contactInformation.get(callId)), (_a = this.knownCalls.get(callId)) === null || _a === void 0 ? void 0 : _a.contact);
    }
    setCallContact(callId, contact) {
        console.log('session.setCallContact');
        const oldContact = this.getStoredCallContact(callId);
        const fullContact = Object.assign(Object.assign({}, oldContact), contact);
        const call = this.knownCalls.get(callId);
        if (!call) {
            this.contactInformation.set(callId, fullContact);
            return;
        }
        call.setContact(fullContact);
        if (this.contactInformation.has(callId)) {
            this.contactInformation.delete(callId);
        }
    }
    isSignalTargetingAnotherSession(signal) {
        if (!signal.sessionId) {
            return false;
        }
        return signal.sessionId !== this._sessionId;
    }
    isCallKnown(callId) {
        return this.knownCalls.has(callId);
    }
    isCallIgnored(callId) {
        return this.ignoredCalls.has(callId);
    }
    processNewCall(signal) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('session.processNewCall');
            // If we already know about this call, we don't need to process anything
            if (this.isCallKnown(signal.callId)) {
                return;
            }
            try {
                if (!isCallRole(signal.body.role)) {
                    throw new Error('invalid-role');
                }
                const webrtcProcessor = yield this.createWebRtcProcessor();
                // Contact will probaby already be stored if this call was requested by this same session
                const contact = this.getStoredCallContact(signal.callId);
                const ignored = this.isCallIgnored(signal.callId) || this.isBusy();
                const config = {
                    transporter: this.transporter,
                    webrtcProcessor,
                };
                const call = new ClientMediaCall(config, signal, { contact, ignored });
                this.knownCalls.set(call.callId, call);
                call.emitter.on('stateChange', (oldState) => this.emit('callStateChange', { call, oldState }));
                call.emitter.on('accepted', () => this.emit('acceptedCall', { call }));
                call.emitter.on('ended', () => this.emit('endedCall', { call }));
                this.emit('newCall', { call });
            }
            catch (e) {
                this.failedCalls.add(signal.callId);
                const errorCode = (e && typeof e === 'object' && e.name) || 'call-initialization-failed';
                this.transporter.sendError(signal.callId, errorCode);
                throw e;
            }
        });
    }
    createWebRtcProcessor() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('session.createWebRtcProcessor');
            const { mediaStreamFactory, processorFactories: { webrtc: webrtcFactory }, } = this.config;
            if (!webrtcFactory) {
                throw new Error('webrtc-not-implemented');
            }
            return webrtcFactory({ mediaStreamFactory });
        });
    }
}
//# sourceMappingURL=Session.js.map