import { Emitter } from '@rocket.chat/emitter';

import { LocalStream } from './LocalStream';
import { RemoteStream } from './RemoteStream';
import type { IWebRTCProcessor, WebRTCInternalStateMap, WebRTCProcessorConfig, WebRTCProcessorEvents } from '../../../definition';
import type { ServiceStateValue } from '../../../definition/services/IServiceProcessor';
import { getExternalWaiter, type PromiseWaiterData } from '../../utils/getExternalWaiter';

export class MediaCallWebRTCProcessor implements IWebRTCProcessor {
	public readonly emitter: Emitter<WebRTCProcessorEvents>;

	private peer: RTCPeerConnection;

	private iceGatheringFinished = false;

	private iceGatheringTimedOut = false;

	private localStream: LocalStream;

	private localMediaStream: MediaStream;

	private localMediaStreamInitialized = false;

	private remoteStream: RemoteStream;

	private remoteMediaStream: MediaStream;

	private iceGatheringWaiters: Set<PromiseWaiterData>;

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

	private iceCandidateCount = 0;

	private lastSetLocalDescription: string | null = null;

	private addedEmptyTransceiver = false;

	private _audioLevelTracker: ReturnType<typeof setInterval> | null;

	private _audioLevel: number;

	public get audioLevel(): number {
		return this._audioLevel;
	}

	private _localAudioLevel: number;

	public get localAudioLevel(): number {
		return this._localAudioLevel;
	}

	constructor(private readonly config: WebRTCProcessorConfig) {
		this.localMediaStream = new MediaStream();
		this.remoteMediaStream = new MediaStream();
		this.iceGatheringWaiters = new Set();
		this.inputTrack = config.inputTrack;
		this._audioLevel = 0;
		this._localAudioLevel = 0;
		this._audioLevelTracker = null;

		this.peer = new RTCPeerConnection(config.rtc);

		this.localStream = new LocalStream(this.localMediaStream, this.peer, this.config.logger);
		this.remoteStream = new RemoteStream(this.remoteMediaStream, this.peer, this.config.logger);

		this.emitter = new Emitter();
		this.registerPeerEvents();

		this.registerAudioLevelTracker();
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
		await this.loadInputTrack();
	}

	public async createOffer({ iceRestart }: { iceRestart?: boolean }): Promise<{ sdp: RTCSessionDescriptionInit }> {
		this.config.logger?.debug('MediaCallWebRTCProcessor.createOffer');
		if (this.stopped) {
			throw new Error('WebRTC Processor has already been stopped.');
		}
		await this.initializeLocalMediaStream();

		if (!this.addedEmptyTransceiver) {
			// If there's no audio transceivers yet, add a new one; since it's an offer, the track can be set later
			const transceivers = this.peer
				.getTransceivers()
				.filter((transceiver) => transceiver.sender.track?.kind === 'audio' || transceiver.receiver.track?.kind === 'audio');

			if (!transceivers.length) {
				this.peer.addTransceiver('audio', { direction: 'sendrecv' });
				this.addedEmptyTransceiver = true;
			}
		}

		if (iceRestart) {
			this.restartIce();
		}

		const offer = await this.peer.createOffer();
		if (this.lastSetLocalDescription && offer.sdp !== this.lastSetLocalDescription && !iceRestart) {
			this.startNewNegotiation();
		}

		this.lastSetLocalDescription = offer.sdp || null;
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
		// Stop only the remote stream; the track of the local stream may still be in use by another call so it's up to the session to stop it.
		this.remoteStream.stopAudio();
		this.unregisterPeerEvents();
		this.unregisterAudioLevelTracker();

		this.peer.close();
	}

	public startNewNegotiation(): void {
		this.iceGatheringFinished = false;
		this.clearIceGatheringWaiters(new Error('new-negotiation'));
		this.iceCandidateCount = 0;
	}

	public async createAnswer({ sdp }: { sdp: RTCSessionDescriptionInit }): Promise<{ sdp: RTCSessionDescriptionInit }> {
		this.config.logger?.debug('MediaCallWebRTCProcessor.createAnswer');
		if (this.stopped) {
			throw new Error('WebRTC Processor has already been stopped.');
		}
		if (sdp.type !== 'offer') {
			throw new Error('invalid-webrtc-offer');
		}
		if (!this.inputTrack) {
			throw new Error('no-input-track');
		}

		await this.initializeLocalMediaStream();

		const transceivers = this.peer
			.getTransceivers()
			.filter((transceiver) => transceiver.sender.track?.kind === 'audio' || transceiver.receiver.track?.kind === 'audio');

		if (!transceivers.length) {
			throw new Error('no-audio-transceiver');
		}

		if (this.peer.remoteDescription?.sdp !== sdp.sdp) {
			this.startNewNegotiation();
			await this.peer.setRemoteDescription(sdp);
		}

		const answer = await this.peer.createAnswer();

		this.lastSetLocalDescription = answer.sdp || null;
		await this.peer.setLocalDescription(answer);

		return this.getLocalDescription();
	}

	public async setRemoteAnswer({ sdp }: { sdp: RTCSessionDescriptionInit }): Promise<void> {
		this.config.logger?.debug('MediaCallWebRTCProcessor.setRemoteAnswer');
		if (this.stopped) {
			return;
		}

		if (sdp.type === 'offer') {
			throw new Error('invalid-answer');
		}

		await this.peer.setRemoteDescription(sdp);
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

	public async getStats(selector?: MediaStreamTrack | null): Promise<RTCStatsReport | null> {
		if (this.stopped) {
			return null;
		}

		return this.peer.getStats(selector);
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

		this.config.logger?.debug('MediaCallWebRTCProcessor.getLocalDescription - ice candidates: ', this.iceCandidateCount);
		// If we don't have any ice candidate, trigger a service error.
		if (this.iceCandidateCount === 0) {
			this.emitter.emit('internalError', { critical: true, error: 'no-ice-candidates' });
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
				if (!this.iceGatheringWaiters.has(iceGatheringData)) {
					return;
				}

				this.config.logger?.debug('MediaCallWebRTCProcessor.waitForIceGathering.timeout', this.iceCandidateCount);
				this.clearIceGatheringData(iceGatheringData);
				this.iceGatheringTimedOut = true;
				this.changeInternalState('iceUntrickler');
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

	private unregisterPeerEvents() {
		try {
			const { peer } = this;

			peer.ontrack = null as any;
			peer.onicecandidate = null as any;
			peer.onicecandidateerror = null as any;
			peer.onconnectionstatechange = null as any;
			peer.oniceconnectionstatechange = null as any;
			peer.onnegotiationneeded = null as any;
			peer.onicegatheringstatechange = null as any;
			peer.onsignalingstatechange = null as any;
		} catch {
			// suppress exceptions here
		}
	}

	private registerAudioLevelTracker() {
		if (this._audioLevelTracker) {
			this.unregisterAudioLevelTracker();
		}

		this._audioLevelTracker = setInterval(() => {
			this.getStats()
				.then((stats) => {
					if (!stats) {
						return;
					}

					stats.forEach((report) => {
						if (report.kind !== 'audio') {
							return;
						}

						switch (report.type) {
							case 'inbound-rtp':
								this._audioLevel = report.audioLevel ?? 0;
								break;
							case 'media-source':
								this._localAudioLevel = report.audioLevel ?? 0;
								break;
						}
					});
				})
				.catch(() => {
					this._audioLevel = 0;
					this._localAudioLevel = 0;
				});
		}, 50);
	}

	private unregisterAudioLevelTracker() {
		if (!this._audioLevelTracker) {
			return;
		}

		clearInterval(this._audioLevelTracker);
		this._audioLevelTracker = null;
		this._audioLevel = 0;
		this._localAudioLevel = 0;
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
		this.iceCandidateCount++;
	}

	private onIceCandidateError(event: RTCPeerConnectionIceErrorEvent) {
		if (this.stopped) {
			return;
		}
		this.config.logger?.debug('MediaCallWebRTCProcessor.onIceCandidateError');
		this.config.logger?.error(event);

		this.emitter.emit('internalError', { critical: false, error: 'ice-candidate-error', errorDetails: JSON.stringify(event) });
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
		this.remoteStream.setTrack(event.track);
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

	private async initializeLocalMediaStream(): Promise<void> {
		if (this.localMediaStreamInitialized) {
			return;
		}
		this.config.logger?.debug('MediaCallWebRTCProcessor.initializeLocalMediaStream');

		await this.loadInputTrack();
	}

	private async loadInputTrack(): Promise<void> {
		this.config.logger?.debug('MediaCallWebRTCProcessor.loadInputTrack');
		this.localMediaStreamInitialized = true;
		await this.localStream.setTrack(this.inputTrack);
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

		const waiters = Array.from(this.iceGatheringWaiters.values());
		this.iceGatheringWaiters.clear();

		for (const iceGatheringData of waiters) {
			this.clearIceGatheringData(iceGatheringData, error);
		}

		this.changeInternalState('iceUntrickler');
	}
}
