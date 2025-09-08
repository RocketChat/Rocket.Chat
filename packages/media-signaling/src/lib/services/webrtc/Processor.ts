import { Emitter } from '@rocket.chat/emitter';

import { LocalStream } from './LocalStream';
import { RemoteStream } from './RemoteStream';
import type { IWebRTCProcessor, WebRTCInternalStateMap, WebRTCProcessorConfig, WebRTCProcessorEvents } from '../../../definition';
import type { ServiceStateValue } from '../../../definition/services/IServiceProcessor';
import { getExternalWaiter, type PromiseWaiterData } from '../../utils/getExternalWaiter';

export class MediaCallWebRTCProcessor implements IWebRTCProcessor {
	public emitter: Emitter<WebRTCProcessorEvents>;

	private peer: RTCPeerConnection;

	private iceGatheringFinished = false;

	private iceGatheringTimedOut = false;

	private localStream: LocalStream;

	private localMediaStream: MediaStream;

	private localMediaStreamInitialized = false;

	private remoteStream: RemoteStream;

	private remoteMediaStream: MediaStream;

	private iceGatheringWaiters: Set<PromiseWaiterData>;

	private inputTrackWaiter: PromiseWaiterData | null;

	private inputTrack: MediaStreamTrack | null;

	private _muted = false;

	public get muted(): boolean {
		return this._muted;
	}

	private _held = false;

	public get held(): boolean {
		return this._held;
	}

	private stopped = false;

	constructor(private readonly config: WebRTCProcessorConfig) {
		this.localMediaStream = new MediaStream();
		this.remoteMediaStream = new MediaStream();
		this.iceGatheringWaiters = new Set();
		this.inputTrack = config.inputTrack;
		this.inputTrackWaiter = null;

		this.localStream = new LocalStream(this.localMediaStream);
		this.remoteStream = new RemoteStream(this.remoteMediaStream);

		this.peer = new RTCPeerConnection(config.rtc);
		this.emitter = new Emitter();
		this.registerPeerEvents();
	}

	public getRemoteMediaStream() {
		return this.remoteMediaStream;
	}

	public async setInputTrack(newInputTrack: MediaStreamTrack | null): Promise<void> {
		this.config.logger?.debug('MediaCallWebRTCProcessor.setInputTrack');
		if (newInputTrack && newInputTrack.kind !== 'audio') {
			throw new Error('Unsupported track kind');
		}

		this.inputTrack = newInputTrack;
		if (this.inputTrackWaiter && !this.inputTrackWaiter.done) {
			this.inputTrackWaiter.promiseResolve();
		} else if (this.localMediaStreamInitialized) {
			await this.loadInputTrack();
		}
	}

	public async createOffer({ iceRestart }: { iceRestart?: boolean }): Promise<{ sdp: RTCSessionDescriptionInit }> {
		this.config.logger?.debug('MediaCallWebRTCProcessor.createOffer');
		if (this.stopped) {
			throw new Error('WebRTC Processor has already been stopped.');
		}
		await this.initializeLocalMediaStream();

		if (iceRestart) {
			this.restartIce();
		}

		const offer = await this.peer.createOffer();
		await this.peer.setLocalDescription(offer);

		return this.getLocalDescription();
	}

	public setMuted(muted: boolean): void {
		if (this.stopped) {
			return;
		}

		this._muted = muted;
		this.localStream.setEnabled(!muted && !this._held);
	}

	public setHeld(held: boolean): void {
		if (this.stopped) {
			return;
		}

		this._held = held;
		this.localStream.setEnabled(!held && !this._muted);
		this.remoteStream.setEnabled(!held);
	}

	public stop(): void {
		this.config.logger?.debug('MediaCallWebRTCProcessor.stop');

		this.stopped = true;
		this.localStream.stopAudio();
		this.remoteStream.stopAudio();
	}

	public async startNewNegotiation(): Promise<void> {
		this.iceGatheringFinished = false;
		this.clearIceGatheringWaiters(new Error('new-negotiation'));
	}

	public async createAnswer({ sdp }: { sdp: RTCSessionDescriptionInit }): Promise<{ sdp: RTCSessionDescriptionInit }> {
		this.config.logger?.debug('MediaCallWebRTCProcessor.createAnswer');
		if (this.stopped) {
			throw new Error('WebRTC Processor has already been stopped.');
		}
		if (sdp.type !== 'offer') {
			throw new Error('invalid-webrtc-offer');
		}

		await this.initializeLocalMediaStream();

		if (this.peer.remoteDescription?.sdp !== sdp.sdp) {
			this.clearIceGatheringWaiters(new Error('ice-restart'));
			this.peer.setRemoteDescription(sdp);
		}

		const answer = await this.peer.createAnswer();

		await this.peer.setLocalDescription(answer);

		return this.getLocalDescription();
	}

	public async setRemoteAnswer({ sdp }: { sdp: RTCSessionDescriptionInit }): Promise<void> {
		this.config.logger?.debug('MediaCallWebRTCProcessor.setRemoteDescription');

		if (this.stopped) {
			return;
		}

		if (sdp.type === 'offer') {
			throw new Error('invalid-answer');
		}

		this.peer.setRemoteDescription(sdp);
	}

	public getInternalState<K extends keyof WebRTCInternalStateMap>(stateName: K): ServiceStateValue<WebRTCInternalStateMap, K> {
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

	private changeInternalState(stateName: keyof WebRTCInternalStateMap): void {
		this.config.logger?.debug('MediaCallWebRTCProcessor.changeInternalState', stateName);
		this.emitter.emit('internalStateChange', stateName);
	}

	private async getLocalDescription(): Promise<{ sdp: RTCSessionDescriptionInit }> {
		this.config.logger?.debug('MediaCallWebRTCProcessor.getLocalDescription');
		if (this.stopped) {
			throw new Error('WebRTC Processor has already been stopped.');
		}
		await this.waitForIceGathering();

		const sdp = this.peer.localDescription;

		if (!sdp) {
			throw new Error('no-local-sdp');
		}

		return {
			sdp,
		};
	}

	private async waitForIceGathering(): Promise<void> {
		this.config.logger?.debug('MediaCallWebRTCProcessor.waitForIceGathering');
		if (this.iceGatheringFinished || this.stopped) {
			return;
		}

		this.iceGatheringTimedOut = false;
		const iceGatheringData = getExternalWaiter({
			timeout: this.config.iceGatheringTimeout,
			timeoutFn: () => {
				if (this.iceGatheringWaiters.has(iceGatheringData)) {
					this.config.logger?.debug('MediaCallWebRTCProcessor.waitForIceGathering - timeout');
					this.clearIceGatheringData(iceGatheringData);
					this.iceGatheringTimedOut = true;
					this.changeInternalState('iceUntrickler');
				}
			},
		});

		this.iceGatheringWaiters.add(iceGatheringData);
		this.changeInternalState('iceUntrickler');
		await iceGatheringData.promise;

		// always wait a little extra to ensure all relevant events have been fired
		// 30ms is low enough that it won't be noticeable by users, but is also enough time to process any local stuff
		await new Promise((resolve) => setTimeout(resolve, 30));
	}

	private registerPeerEvents() {
		const { peer } = this;

		peer.ontrack = (event) => this.onTrack(event);
		peer.onicecandidate = (event) => this.onIceCandidate(event);
		peer.onicecandidateerror = (event) => this.onIceCandidateError(event);
		peer.onconnectionstatechange = () => this.onConnectionStateChange();
		peer.oniceconnectionstatechange = () => this.onIceConnectionStateChange();
		peer.onnegotiationneeded = () => this.onNegotiationNeeded();
		peer.onicegatheringstatechange = () => this.onIceGatheringStateChange();
		peer.onsignalingstatechange = () => this.onSignalingStateChange();
	}

	private restartIce() {
		this.config.logger?.debug('MediaCallWebRTCProcessor.restartIce');
		this.startNewNegotiation();

		this.peer.restartIce();
	}

	private onIceCandidate(event: RTCPeerConnectionIceEvent) {
		if (this.stopped) {
			return;
		}

		this.config.logger?.debug('MediaCallWebRTCProcessor.onIceCandidate', event.candidate);
	}

	private onIceCandidateError(event: RTCPeerConnectionIceErrorEvent) {
		if (this.stopped) {
			return;
		}
		this.config.logger?.debug('MediaCallWebRTCProcessor.onIceCandidateError');
		this.config.logger?.error(event);
		this.emitter.emit('internalError', { critical: false, error: 'ice-candidate-error' });
	}

	private onNegotiationNeeded() {
		if (this.stopped) {
			return;
		}
		this.config.logger?.debug('MediaCallWebRTCProcessor.onNegotiationNeeded');
		this.emitter.emit('negotiationNeeded');
	}

	private onTrack(event: RTCTrackEvent): void {
		if (this.stopped) {
			return;
		}
		this.config.logger?.debug('MediaCallWebRTCProcessor.onTrack', event.track.kind);
		// Received a remote stream
		this.remoteStream.setTrack(event.track, this.peer);
	}

	private onConnectionStateChange() {
		if (this.stopped) {
			return;
		}
		this.config.logger?.debug('MediaCallWebRTCProcessor.onConnectionStateChange');
		this.changeInternalState('connection');
	}

	private onIceConnectionStateChange() {
		if (this.stopped) {
			return;
		}
		this.config.logger?.debug('MediaCallWebRTCProcessor.onIceConnectionStateChange');
		this.changeInternalState('iceConnection');
	}

	private onSignalingStateChange() {
		if (this.stopped) {
			return;
		}

		this.config.logger?.debug('MediaCallWebRTCProcessor.onSignalingStateChange');
		this.changeInternalState('signaling');
	}

	private onIceGatheringStateChange() {
		if (this.stopped) {
			return;
		}

		this.config.logger?.debug('MediaCallWebRTCProcessor.onIceGatheringStateChange');

		if (this.peer.iceGatheringState === 'complete') {
			this.onIceGatheringComplete();
		}

		this.changeInternalState('iceGathering');
	}

	private async waitForInputTrack(): Promise<void> {
		this.config.logger?.debug('MediaCallWebRTCProcessor.waitForInputTrack');
		if (this.inputTrack || this.stopped) {
			return;
		}

		if (this.inputTrackWaiter && !this.inputTrackWaiter.done) {
			return this.inputTrackWaiter.promise;
		}

		const tracker = getExternalWaiter({
			timeout: 30000,
			timeoutFn: () => {
				if (this.inputTrack) {
					tracker.promiseResolve();
					return;
				}

				this.config.logger?.error('MediaCallWebRTCProcessor.waitForInputTrack - Timeout reached with no input track in place.');
				this.emitter.emit('internalError', { critical: true, error: 'no-input-track' });
			},
			cleanupFn: () => {
				if (this.inputTrackWaiter === tracker) {
					this.inputTrackWaiter = null;
				}
			},
		});
		this.inputTrackWaiter = tracker;
		return this.inputTrackWaiter.promise;
	}

	private async initializeLocalMediaStream(): Promise<void> {
		if (this.localMediaStreamInitialized) {
			return;
		}
		this.config.logger?.debug('MediaCallWebRTCProcessor.initializeLocalMediaStream');
		const { mediaStreamFactory } = this.config;

		if (mediaStreamFactory) {
			const userMedia = await mediaStreamFactory({ audio: true });
			const tracks = userMedia.getAudioTracks();

			if (!tracks.length) {
				this.config.logger?.error('MediaCallWebRTCProcessor.initializeLocalMediaStream - Media stream has no audio tracks.');
				this.emitter.emit('internalError', { critical: true, error: 'no-input-track' });
				throw new Error('Media Stream has no audio tracks.');
			}

			this.inputTrack = tracks[0];
		}

		await this.loadInputTrack();
	}

	private async loadInputTrack(): Promise<void> {
		this.config.logger?.debug('MediaCallWebRTCProcessor.loadInputTrack');

		this.localMediaStreamInitialized = true;
		await this.waitForInputTrack();
		await this.localStream.setTrack(this.inputTrack, this.peer);
	}

	private onIceGatheringComplete() {
		this.config.logger?.debug('MediaCallWebRTCProcessor.onIceGatheringComplete');
		this.iceGatheringFinished = true;

		this.clearIceGatheringWaiters();
	}

	private clearIceGatheringData(iceGatheringData: PromiseWaiterData, error?: Error) {
		this.config.logger?.debug('MediaCallWebRTCProcessor.clearIceGatheringData');
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

	private clearIceGatheringWaiters(error?: Error) {
		this.config.logger?.debug('MediaCallWebRTCProcessor.clearIceGatheringWaiters');
		this.iceGatheringTimedOut = false;

		if (!this.iceGatheringWaiters.size) {
			return;
		}

		const waiters = this.iceGatheringWaiters.values().toArray();
		this.iceGatheringWaiters.clear();

		for (const iceGatheringData of waiters) {
			this.clearIceGatheringData(iceGatheringData, error);
		}

		this.changeInternalState('iceUntrickler');
	}
}
