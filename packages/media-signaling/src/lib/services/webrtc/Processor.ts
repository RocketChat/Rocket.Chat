import { LocalStream } from './LocalStream';
import { RemoteStream } from './RemoteStream';
import type { IWebRTCProcessor, WebRTCProcessorConfig } from '../../../definition';

type IceGatheringData = {
	promise: Promise<void>;
	promiseReject: (error: Error) => void;
	promiseResolve: () => void;
	timeout: ReturnType<typeof setTimeout>;
};

export class MediaCallWebRTCProcessor implements IWebRTCProcessor {
	private peer: RTCPeerConnection;

	private iceGatheringFinished = false;

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
		this.registerPeerEvents();
	}

	public getRemoteMediaStream() {
		return this.remoteMediaStream;
	}

	public async createOffer({ iceRestart }: { iceRestart?: boolean }): Promise<{ sdp: RTCSessionDescriptionInit }> {
		console.log('processor.createOffer');
		await this.initializeLocalMediaStream();

		if (iceRestart) {
			this.restartIce();
		}

		console.log('peer.createOffer');
		// #ToDo: direction changes

		const offer = await this.peer.createOffer();
		console.log('setLocalDescription');
		await this.peer.setLocalDescription(offer);

		console.log('return getLocalDescription');
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
		console.log('setRemoteDescription');
		await this.initializeLocalMediaStream();

		// #ToDo: validate this.peer.signalingState ?

		console.log('peer.setRemoteDescription');

		this.peer.setRemoteDescription(sdp);
	}

	protected async getuserMedia(constraints: MediaStreamConstraints) {
		return this.config.mediaStreamFactory(constraints);
	}

	private async getLocalDescription(): Promise<{ sdp: RTCSessionDescriptionInit }> {
		console.log('getLocalDescription');
		await this.waitForIceGathering();
		console.log('waited');

		await new Promise((resolve) => setTimeout(resolve, 30));
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
	}

	private async waitForIceGathering(): Promise<void> {
		if (this.iceGatheringFinished) {
			return;
		}

		if (this.peer.iceGatheringState === 'complete') {
			console.log('ice gathering already complete');
			return;
		}

		const data: Partial<IceGatheringData> = {};

		data.promise = new Promise((resolve, reject) => {
			data.promiseResolve = resolve;
			data.promiseReject = reject;
		});

		const iceGatheringData = data as IceGatheringData;
		data.timeout = setTimeout(() => {
			console.log('timeout');
			if (this.iceGatheringWaiters.has(iceGatheringData)) {
				this.clearIceGatheringData(iceGatheringData);
			} else {
				console.log('ice gathering not on the list');
			}
		}, 500);

		this.iceGatheringWaiters.add(iceGatheringData);
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
		// if (event.candidate) {
		// 	this.localCandidates.add(event.candidate);
		// }
	}

	private onIceCandidateError(peer: RTCPeerConnection, _event: RTCPeerConnectionIceErrorEvent) {
		if (peer !== this.peer) {
			return;
		}
		console.log('onIceCandidate ERROR event');
		//
	}

	private onNegotiationNeeded(peer: RTCPeerConnection) {
		if (peer !== this.peer) {
			return;
		}
		console.log('onNegotiationNeeded event');
	}

	private onTrack(peer: RTCPeerConnection, event: RTCTrackEvent): void {
		if (peer !== this.peer) {
			return;
		}
		// Received a remote stream
		console.log('ontrack', event.track.kind, event.track.enabled);

		this.remoteStream.setTrack(event.track, peer);
	}

	private onConnectionStateChange(peer: RTCPeerConnection) {
		if (peer !== this.peer) {
			return;
		}

		console.log('Connection state change', peer.connectionState);
	}

	private onIceConnectionStateChange(peer: RTCPeerConnection) {
		if (peer !== this.peer) {
			return;
		}

		console.log('Ice connection state change', peer.iceConnectionState);
	}

	private onSignalingStateChange(peer: RTCPeerConnection) {
		if (peer !== this.peer) {
			return;
		}

		console.log('Signaling state change', peer.signalingState);
	}

	private onIceGatheringStateChange(peer: RTCPeerConnection) {
		if (peer !== this.peer) {
			return;
		}

		console.log('Ice gathering state change', peer.iceGatheringState);

		if (peer.iceGatheringState === 'complete') {
			this.onIceGatheringComplete();
		}
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
		console.log('onIceGatheringComplete');
		this.iceGatheringFinished = true;

		this.clearIceGatheringWaiters();
	}

	private clearIceGatheringData(iceGatheringData: IceGatheringData, error?: Error) {
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

	private clearIceGatheringWaiters(error?: Error) {
		console.log('clear waiters');
		const waiters = this.iceGatheringWaiters.values().toArray();
		this.iceGatheringWaiters.clear();

		for (const iceGatheringData of waiters) {
			this.clearIceGatheringData(iceGatheringData, error);
		}
	}
}
