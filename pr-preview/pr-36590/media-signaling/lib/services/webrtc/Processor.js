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
import { LocalStream } from './LocalStream';
import { RemoteStream } from './RemoteStream';
export class MediaCallWebRTCProcessor {
    constructor(config) {
        this.config = config;
        this.iceGatheringFinished = false;
        this.iceGatheringTimedOut = false;
        this.localMediaStreamInitialized = false;
        this.localMediaStream = new MediaStream();
        this.remoteMediaStream = new MediaStream();
        this.iceGatheringWaiters = new Set();
        this.localStream = new LocalStream(this.localMediaStream);
        this.remoteStream = new RemoteStream(this.remoteMediaStream);
        this.peer = new RTCPeerConnection();
        this.emitter = new Emitter();
        this.registerPeerEvents();
    }
    getRemoteMediaStream() {
        return this.remoteMediaStream;
    }
    createOffer(_a) {
        return __awaiter(this, arguments, void 0, function* ({ iceRestart }) {
            var _b;
            (_b = this.config.logger) === null || _b === void 0 ? void 0 : _b.debug('MediaCallWebRTCProcessor.createOffer');
            yield this.initializeLocalMediaStream();
            if (iceRestart) {
                this.restartIce();
            }
            const offer = yield this.peer.createOffer();
            yield this.peer.setLocalDescription(offer);
            return this.getLocalDescription();
        });
    }
    createAnswer(_a) {
        return __awaiter(this, arguments, void 0, function* ({ sdp }) {
            var _b, _c;
            (_b = this.config.logger) === null || _b === void 0 ? void 0 : _b.debug('MediaCallWebRTCProcessor.createAnswer');
            if (sdp.type !== 'offer') {
                throw new Error('invalid-webrtc-offer');
            }
            yield this.initializeLocalMediaStream();
            if (((_c = this.peer.remoteDescription) === null || _c === void 0 ? void 0 : _c.sdp) !== sdp.sdp) {
                this.peer.setRemoteDescription(sdp);
            }
            const answer = yield this.peer.createAnswer();
            yield this.peer.setLocalDescription(answer);
            return this.getLocalDescription();
        });
    }
    setRemoteDescription(_a) {
        return __awaiter(this, arguments, void 0, function* ({ sdp }) {
            var _b;
            (_b = this.config.logger) === null || _b === void 0 ? void 0 : _b.debug('MediaCallWebRTCProcessor.setRemoteDescription');
            yield this.initializeLocalMediaStream();
            this.peer.setRemoteDescription(sdp);
        });
    }
    getInternalState(stateName) {
        switch (stateName) {
            case 'signaling':
                return this.peer.signalingState;
            case 'connection':
                return this.peer.connectionState;
            case 'iceConnection':
                return this.peer.iceConnectionState;
            case 'iceGathering':
                return this.peer.iceGatheringState;
            case 'iceUntrickler':
                if (this.iceGatheringTimedOut) {
                    return 'timeout';
                }
                return this.iceGatheringWaiters.size > 0 ? 'waiting' : 'not-waiting';
        }
    }
    getuserMedia(constraints) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            (_a = this.config.logger) === null || _a === void 0 ? void 0 : _a.debug('MediaCallWebRTCProcessor.getuserMedia');
            return this.config.mediaStreamFactory(constraints);
        });
    }
    changeInternalState(stateName) {
        var _a;
        (_a = this.config.logger) === null || _a === void 0 ? void 0 : _a.debug('MediaCallWebRTCProcessor.changeInternalState', stateName);
        this.emitter.emit('internalStateChange', stateName);
    }
    getLocalDescription() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            (_a = this.config.logger) === null || _a === void 0 ? void 0 : _a.debug('MediaCallWebRTCProcessor.getLocalDescription');
            yield this.waitForIceGathering();
            // always wait a little extra to ensure all relevant events have been fired
            // 30ms is low enough that it won't be noticeable by users, but is also enough time to process a full `host` candidate
            yield new Promise((resolve) => setTimeout(resolve, 30));
            const sdp = this.peer.localDescription;
            if (!sdp) {
                throw new Error('no-local-sdp');
            }
            return {
                sdp,
            };
        });
    }
    waitForIceGathering() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            (_a = this.config.logger) === null || _a === void 0 ? void 0 : _a.debug('MediaCallWebRTCProcessor.waitForIceGathering');
            if (this.iceGatheringFinished) {
                return;
            }
            if (this.peer.iceGatheringState === 'complete') {
                return;
            }
            this.iceGatheringTimedOut = false;
            const data = {};
            data.promise = new Promise((resolve, reject) => {
                data.promiseResolve = resolve;
                data.promiseReject = reject;
            });
            const iceGatheringData = data;
            data.timeout = setTimeout(() => {
                if (this.iceGatheringWaiters.has(iceGatheringData)) {
                    this.clearIceGatheringData(iceGatheringData);
                    this.iceGatheringTimedOut = true;
                    this.changeInternalState('iceUntrickler');
                }
            }, 500);
            this.iceGatheringWaiters.add(iceGatheringData);
            this.changeInternalState('iceUntrickler');
            return data.promise;
        });
    }
    registerPeerEvents() {
        const { peer } = this;
        peer.ontrack = (event) => this.onTrack(peer, event);
        peer.onicecandidate = (event) => this.onIceCandidate(peer, event);
        peer.onicecandidateerror = (event) => this.onIceCandidateError(peer, event);
        peer.onconnectionstatechange = () => this.onConnectionStateChange(peer);
        peer.oniceconnectionstatechange = () => this.onIceConnectionStateChange(peer);
        peer.onnegotiationneeded = () => this.onNegotiationNeeded(peer);
        peer.onicegatheringstatechange = () => this.onIceGatheringStateChange(peer);
        peer.onsignalingstatechange = () => this.onSignalingStateChange(peer);
    }
    restartIce() {
        var _a;
        (_a = this.config.logger) === null || _a === void 0 ? void 0 : _a.debug('MediaCallWebRTCProcessor.restartIce');
        this.iceGatheringFinished = false;
        this.clearIceGatheringWaiters(new Error('ice-restart'));
        this.peer.restartIce();
    }
    onIceCandidate(peer, event) {
        var _a;
        if (peer !== this.peer) {
            return;
        }
        (_a = this.config.logger) === null || _a === void 0 ? void 0 : _a.debug('MediaCallWebRTCProcessor.onIceCandidate', event.candidate);
    }
    onIceCandidateError(peer, event) {
        var _a, _b;
        if (peer !== this.peer) {
            return;
        }
        (_a = this.config.logger) === null || _a === void 0 ? void 0 : _a.debug('MediaCallWebRTCProcessor.onIceCandidateError');
        (_b = this.config.logger) === null || _b === void 0 ? void 0 : _b.error(event);
        this.emitter.emit('internalError', { critical: false, error: 'ice-candidate-error' });
    }
    onNegotiationNeeded(peer) {
        var _a;
        if (peer !== this.peer) {
            return;
        }
        (_a = this.config.logger) === null || _a === void 0 ? void 0 : _a.debug('MediaCallWebRTCProcessor.onNegotiationNeeded');
    }
    onTrack(peer, event) {
        var _a;
        if (peer !== this.peer) {
            return;
        }
        (_a = this.config.logger) === null || _a === void 0 ? void 0 : _a.debug('MediaCallWebRTCProcessor.onTrack', event.track.kind);
        // Received a remote stream
        this.remoteStream.setTrack(event.track, peer);
    }
    onConnectionStateChange(peer) {
        var _a;
        if (peer !== this.peer) {
            return;
        }
        (_a = this.config.logger) === null || _a === void 0 ? void 0 : _a.debug('MediaCallWebRTCProcessor.onConnectionStateChange');
        this.changeInternalState('connection');
    }
    onIceConnectionStateChange(peer) {
        var _a;
        if (peer !== this.peer) {
            return;
        }
        (_a = this.config.logger) === null || _a === void 0 ? void 0 : _a.debug('MediaCallWebRTCProcessor.onIceConnectionStateChange');
        this.changeInternalState('iceConnection');
    }
    onSignalingStateChange(peer) {
        var _a;
        if (peer !== this.peer) {
            return;
        }
        (_a = this.config.logger) === null || _a === void 0 ? void 0 : _a.debug('MediaCallWebRTCProcessor.onSignalingStateChange');
        this.changeInternalState('signaling');
    }
    onIceGatheringStateChange(peer) {
        var _a;
        if (peer !== this.peer) {
            return;
        }
        (_a = this.config.logger) === null || _a === void 0 ? void 0 : _a.debug('MediaCallWebRTCProcessor.onIceGatheringStateChange');
        if (peer.iceGatheringState === 'complete') {
            this.onIceGatheringComplete();
        }
        this.changeInternalState('iceGathering');
    }
    initializeLocalMediaStream() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (this.localMediaStreamInitialized) {
                return;
            }
            (_a = this.config.logger) === null || _a === void 0 ? void 0 : _a.debug('MediaCallWebRTCProcessor.initializeLocalMediaStream');
            const mediaStream = yield this.getuserMedia({ audio: true });
            this.localStream.setStreamTracks(mediaStream, this.peer);
            this.localMediaStreamInitialized = true;
        });
    }
    onIceGatheringComplete() {
        var _a;
        (_a = this.config.logger) === null || _a === void 0 ? void 0 : _a.debug('MediaCallWebRTCProcessor.onIceGatheringComplete');
        this.iceGatheringFinished = true;
        this.clearIceGatheringWaiters();
    }
    clearIceGatheringData(iceGatheringData, error) {
        var _a;
        (_a = this.config.logger) === null || _a === void 0 ? void 0 : _a.debug('MediaCallWebRTCProcessor.clearIceGatheringData');
        if (this.iceGatheringWaiters.has(iceGatheringData)) {
            this.iceGatheringWaiters.delete(iceGatheringData);
        }
        if (iceGatheringData.timeout) {
            clearTimeout(iceGatheringData.timeout);
        }
        if (error) {
            if (iceGatheringData.promiseReject) {
                iceGatheringData.promiseReject(error);
            }
            return;
        }
        if (iceGatheringData.promiseResolve) {
            iceGatheringData.promiseResolve();
        }
    }
    clearIceGatheringWaiters(error) {
        var _a;
        (_a = this.config.logger) === null || _a === void 0 ? void 0 : _a.debug('MediaCallWebRTCProcessor.clearIceGatheringWaiters');
        const waiters = this.iceGatheringWaiters.values().toArray();
        this.iceGatheringWaiters.clear();
        this.iceGatheringTimedOut = false;
        for (const iceGatheringData of waiters) {
            this.clearIceGatheringData(iceGatheringData, error);
        }
        this.changeInternalState('iceUntrickler');
    }
}
//# sourceMappingURL=Processor.js.map