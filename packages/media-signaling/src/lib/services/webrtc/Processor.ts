import { Emitter } from '@rocket.chat/emitter';

import { LocalStream } from './LocalStream';
import { RemoteStream } from './RemoteStream';
import type { IWebRTCProcessor, WebRTCInternalStateMap, WebRTCProcessorConfig, WebRTCProcessorEvents } from '../../../definition';
import type { ServiceStateValue } from '../../../definition/services/IServiceProcessor';

type IceGatheringData = {
	promise: Promise<void>;
	promiseReject: (error: Error) => void;
	promiseResolve: () => void;
	timeout: ReturnType<typeof setTimeout>;
};

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

	private iceGatheringWaiters: Set<IceGatheringData>;

	constructor(private readonly config: WebRTCProcessorConfig) {
		this.localMediaStream = new MediaStream();
		this.remoteMediaStream = new MediaStream();
		this.iceGatheringWaiters = new Set();

		this.localStream = new LocalStream(this.localMediaStream);
		this.remoteStream = new RemoteStream(this.remoteMediaStream);

		this.peer = new RTCPeerConnection();
		this.emitter = new Emitter();
		this.registerPeerEvents();
	}

	public getRemoteMediaStream() {
		return this.remoteMediaStream;
	}

	public async createOffer({ iceRestart }: { iceRestart?: boolean }): Promise<{ sdp: RTCSessionDescriptionInit }> {
		await this.initializeLocalMediaStream();

		if (iceRestart) {
			this.restartIce();
		}

		// #ToDo: direction changes

		const offer = await this.peer.createOffer();
		await this.peer.setLocalDescription(offer);

		return this.getLocalDescription();
	}

	public async createAnswer({ sdp }: { sdp: RTCSessionDescriptionInit }): Promise<{ sdp: RTCSessionDescriptionInit }> {
		if (sdp.type !== 'offer') {
			throw new Error('invalid-webrtc-offer');
		}

		await this.initializeLocalMediaStream();

		// #ToDo: direction changes
		if (this.peer.remoteDescription?.sdp !== sdp.sdp) {
			this.peer.setRemoteDescription(sdp);
		}

		const answer = await this.peer.createAnswer();
		await this.peer.setLocalDescription(answer);

		return this.getLocalDescription();
	}

	public async setRemoteDescription({ sdp }: { sdp: RTCSessionDescriptionInit }): Promise<void> {
		await this.initializeLocalMediaStream();

		// #ToDo: validate this.peer.signalingState ?
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

	protected async getuserMedia(constraints: MediaStreamConstraints) {
		return this.config.mediaStreamFactory(constraints);
	}

	private changeInternalState(stateName: keyof WebRTCInternalStateMap): void {
		this.emitter.emit('internalStateChange', stateName);
	}

	private async getLocalDescription(): Promise<{ sdp: RTCSessionDescriptionInit }> {
		await this.waitForIceGathering();

		// always wait a little extra to ensure all relevant events have been fired
		await new Promise((resolve) => setTimeout(resolve, 30));

		const sdp = this.peer.localDescription;

		if (!sdp) {
			throw new Error('no-local-sdp');
		}

		return {
			sdp,
		};
	}

	private async waitForIceGathering(): Promise<void> {
		if (this.iceGatheringFinished) {
			return;
		}

		if (this.peer.iceGatheringState === 'complete') {
			return;
		}

		this.iceGatheringTimedOut = false;

		const data: Partial<IceGatheringData> = {};

		data.promise = new Promise((resolve, reject) => {
			data.promiseResolve = resolve;
			data.promiseReject = reject;
		});

		const iceGatheringData = data as IceGatheringData;
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
	}

	private registerPeerEvents() {
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

	private restartIce() {
		this.iceGatheringFinished = false;

		this.clearIceGatheringWaiters(new Error('ice-restart'));

		this.peer.restartIce();
	}

	private onIceCandidate(peer: RTCPeerConnection, event: RTCPeerConnectionIceEvent) {
		if (peer !== this.peer) {
			return;
		}

		console.log('onIceCandidate event', event.candidate);
	}

	private onIceCandidateError(peer: RTCPeerConnection, event: RTCPeerConnectionIceErrorEvent) {
		if (peer !== this.peer) {
			return;
		}
		console.error('onIceCandidate ERROR event', event.errorCode, event.errorText);
		this.emitter.emit('internalError', { critical: false, error: 'ice-candidate-error' });
	}

	private onNegotiationNeeded(peer: RTCPeerConnection) {
		if (peer !== this.peer) {
			return;
		}
		// #ToDo negotiation needed
		console.log('negotiation-needed');
	}

	private onTrack(peer: RTCPeerConnection, event: RTCTrackEvent): void {
		if (peer !== this.peer) {
			return;
		}
		// Received a remote stream
		this.remoteStream.setTrack(event.track, peer);
	}

	private onConnectionStateChange(peer: RTCPeerConnection) {
		if (peer !== this.peer) {
			return;
		}

		this.changeInternalState('connection');
	}

	private onIceConnectionStateChange(peer: RTCPeerConnection) {
		if (peer !== this.peer) {
			return;
		}

		this.changeInternalState('iceConnection');
	}

	private onSignalingStateChange(peer: RTCPeerConnection) {
		if (peer !== this.peer) {
			return;
		}

		this.changeInternalState('signaling');
	}

	private onIceGatheringStateChange(peer: RTCPeerConnection) {
		if (peer !== this.peer) {
			return;
		}

		if (peer.iceGatheringState === 'complete') {
			this.onIceGatheringComplete();
		}

		this.changeInternalState('iceGathering');
	}

	private async initializeLocalMediaStream(): Promise<void> {
		if (this.localMediaStreamInitialized) {
			return;
		}

		const mediaStream = await this.getuserMedia({ audio: true });

		this.localStream.setStreamTracks(mediaStream, this.peer);

		this.localMediaStreamInitialized = true;
	}

	private onIceGatheringComplete() {
		this.iceGatheringFinished = true;

		this.clearIceGatheringWaiters();
	}

	private clearIceGatheringData(iceGatheringData: IceGatheringData, error?: Error) {
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
		const waiters = this.iceGatheringWaiters.values().toArray();
		this.iceGatheringWaiters.clear();
		this.iceGatheringTimedOut = false;

		for (const iceGatheringData of waiters) {
			this.clearIceGatheringData(iceGatheringData, error);
		}

		this.changeInternalState('iceUntrickler');
	}
}
