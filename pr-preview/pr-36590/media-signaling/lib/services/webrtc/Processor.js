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
            console.log('processor.createOffer');
            yield this.initializeLocalMediaStream();
            if (iceRestart) {
                this.restartIce();
            }
            console.log('peer.createOffer');
            // #ToDo: direction changes
            const offer = yield this.peer.createOffer();
            console.log('setLocalDescription');
            yield this.peer.setLocalDescription(offer);
            console.log('return getLocalDescription');
            return this.getLocalDescription();
        });
    }
    createAnswer(_a) {
        return __awaiter(this, arguments, void 0, function* ({ sdp }) {
            var _b;
            if (sdp.type !== 'offer') {
                throw new Error('invalid-webrtc-offer');
            }
            yield this.initializeLocalMediaStream();
            // #ToDo: direction changes
            if (((_b = this.peer.remoteDescription) === null || _b === void 0 ? void 0 : _b.sdp) !== sdp.sdp) {
                this.peer.setRemoteDescription(sdp);
            }
            const answer = yield this.peer.createAnswer();
            yield this.peer.setLocalDescription(answer);
            return this.getLocalDescription();
        });
    }
    setRemoteDescription(_a) {
        return __awaiter(this, arguments, void 0, function* ({ sdp }) {
            console.log('setRemoteDescription');
            yield this.initializeLocalMediaStream();
            // #ToDo: validate this.peer.signalingState ?
            console.log('peer.setRemoteDescription');
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
            return this.config.mediaStreamFactory(constraints);
        });
    }
    changeInternalState(stateName) {
        this.emitter.emit('internalStateChange', stateName);
    }
    getLocalDescription() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('getLocalDescription');
            yield this.waitForIceGathering();
            console.log('waited');
            yield new Promise((resolve) => setTimeout(resolve, 30));
            console.log('extra waited');
            const sdp = this.peer.localDescription;
            if (!sdp) {
                console.log('no-local-sdp');
                throw new Error('no-local-sdp');
            }
            console.log('return sdp');
            return {
                sdp,
            };
        });
    }
    waitForIceGathering() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.iceGatheringFinished) {
                return;
            }
            if (this.peer.iceGatheringState === 'complete') {
                console.log('ice gathering already complete');
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
                console.log('timeout');
                if (this.iceGatheringWaiters.has(iceGatheringData)) {
                    this.clearIceGatheringData(iceGatheringData);
                    this.iceGatheringTimedOut = true;
                    this.changeInternalState('iceUntrickler');
                }
                else {
                    console.log('ice gathering not on the list');
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
        this.iceGatheringFinished = false;
        this.clearIceGatheringWaiters(new Error('ice-restart'));
        this.peer.restartIce();
    }
    onIceCandidate(peer, event) {
        if (peer !== this.peer) {
            return;
        }
        console.log('onIceCandidate event', event.candidate);
        // if (event.candidate) {
        // 	this.localCandidates.add(event.candidate);
        // }
    }
    onIceCandidateError(peer, _event) {
        if (peer !== this.peer) {
            return;
        }
        console.log('onIceCandidate ERROR event');
        this.emitter.emit('internalError', { critical: false, error: 'ice-candidate-error' });
    }
    onNegotiationNeeded(peer) {
        if (peer !== this.peer) {
            return;
        }
        console.log('onNegotiationNeeded event');
    }
    onTrack(peer, event) {
        if (peer !== this.peer) {
            return;
        }
        // Received a remote stream
        console.log('ontrack', event.track.kind, event.track.enabled);
        this.remoteStream.setTrack(event.track, peer);
    }
    onConnectionStateChange(peer) {
        if (peer !== this.peer) {
            return;
        }
        console.log('Connection state change', peer.connectionState);
        this.changeInternalState('connection');
    }
    onIceConnectionStateChange(peer) {
        if (peer !== this.peer) {
            return;
        }
        console.log('Ice connection state change', peer.iceConnectionState);
        this.changeInternalState('iceConnection');
    }
    onSignalingStateChange(peer) {
        if (peer !== this.peer) {
            return;
        }
        console.log('Signaling state change', peer.signalingState);
        this.changeInternalState('signaling');
    }
    onIceGatheringStateChange(peer) {
        if (peer !== this.peer) {
            return;
        }
        console.log('Ice gathering state change', peer.iceGatheringState);
        if (peer.iceGatheringState === 'complete') {
            this.onIceGatheringComplete();
        }
        this.changeInternalState('iceGathering');
    }
    initializeLocalMediaStream() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.localMediaStreamInitialized) {
                return;
            }
            const mediaStream = yield this.getuserMedia({ audio: true });
            this.localStream.setStreamTracks(mediaStream, this.peer);
            this.localMediaStreamInitialized = true;
        });
    }
    onIceGatheringComplete() {
        console.log('onIceGatheringComplete');
        this.iceGatheringFinished = true;
        this.clearIceGatheringWaiters();
    }
    clearIceGatheringData(iceGatheringData, error) {
        console.log('clearIceGatheringData');
        if (this.iceGatheringWaiters.has(iceGatheringData)) {
            this.iceGatheringWaiters.delete(iceGatheringData);
        }
        if (iceGatheringData.timeout) {
            console.log('clearTimeout');
            clearTimeout(iceGatheringData.timeout);
        }
        if (error) {
            console.log('reject wait promise');
            if (iceGatheringData.promiseReject) {
                iceGatheringData.promiseReject(error);
            }
            return;
        }
        console.log('resolve wait promise');
        if (iceGatheringData.promiseResolve) {
            iceGatheringData.promiseResolve();
        }
    }
    clearIceGatheringWaiters(error) {
        console.log('clear waiters');
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