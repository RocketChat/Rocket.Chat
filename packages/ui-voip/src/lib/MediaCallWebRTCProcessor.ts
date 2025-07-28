import { DeliverParams, IWebRTCProcessor, RequestParams } from '@rocket.chat/media-signaling';

export class MediaCallWebRTCProcessor implements IWebRTCProcessor {
	private peer: RTCPeerConnection;

	private iceGatheringFinished = false;

	private localMediaStream: MediaStream;

	private localMediaStreamInitialized = false;

	private remoteMediaStream: MediaStream;

	constructor() {
		this.localMediaStream = new MediaStream();
		this.remoteMediaStream = new MediaStream();

		this.peer = new RTCPeerConnection();
		this.registerPeerEvents();
	}

	public getRemoteMediaStream() {
		return this.remoteMediaStream;
	}

	public async createOffer({ iceRestart }: RequestParams<'offer'>): Promise<DeliverParams<'sdp'>> {
		await this.initializeLocalMediaStream();

		if (iceRestart) {
			this.restartIce();
		}

		// #ToDo: direction changes

		const offer = await this.peer.createOffer();
		await this.peer.setLocalDescription(offer);

		return {
			sdp: offer,
			endOfCandidates: this.iceGatheringFinished,
		};
	}

	public async createAnswer({ offer }: RequestParams<'answer'>): Promise<DeliverParams<'sdp'>> {
		await this.initializeLocalMediaStream();

		// #ToDo: direction changes
		if (this.peer.remoteDescription?.sdp !== offer.sdp) {
			this.peer.setRemoteDescription(offer);
		}

		const answer = await this.peer.createAnswer();
		await this.peer.setLocalDescription(answer);

		return {
			sdp: answer,
			endOfCandidates: this.iceGatheringFinished,
		};
	}

	public async collectLocalDescription(_params: RequestParams<'sdp'>): Promise<DeliverParams<'sdp'>> {
		await this.initializeLocalMediaStream();

		const sdp = this.peer.localDescription;

		if (!sdp) {
			throw new Error('no-local-sdp');
		}

		return {
			sdp,
			endOfCandidates: this.iceGatheringFinished,
		};
	}

	public async setRemoteDescription({ sdp }: DeliverParams<'sdp'>): Promise<void> {
		await this.initializeLocalMediaStream();

		// #ToDo: validate this.peer.signalingState ?

		this.peer.setRemoteDescription(sdp);
	}

	public async addIceCandidates({ candidates }: DeliverParams<'ice-candidates'>): Promise<void> {
		const results = await Promise.allSettled(candidates.map((candidate) => this.peer?.addIceCandidate(candidate)));

		for (const result of results) {
			if (result.status === 'rejected') {
				throw result.reason;
			}
		}
	}

	protected async getuserMedia(constraints: MediaStreamConstraints) {
		if (navigator.mediaDevices === undefined) {
			throw new Error('Media devices not available in insecure contexts.');
		}

		return navigator.mediaDevices.getUserMedia.call(navigator.mediaDevices, constraints);
	}

	private registerPeerEvents() {
		this.peer.ontrack = (event) => this.onTrack(event);
		this.peer.onicecandidate = (event) => this.onIceCandidate(event);
		this.peer.onicecandidateerror = (event) => this.onIceCandidateError(event);
		this.peer.onconnectionstatechange = () => this.onConnectionStateChange();
		this.peer.oniceconnectionstatechange = () => this.onIceConnectionStateChange();
		this.peer.onnegotiationneeded = () => this.onNegotiationNeeded();
	}

	private restartIce() {
		this.iceGatheringFinished = false;
		this.peer.restartIce();
	}

	private onIceCandidate(_event: RTCPeerConnectionIceEvent) {
		console.log('onIceCandidate event');
		//
	}

	private onIceCandidateError(_event: RTCPeerConnectionIceErrorEvent) {
		console.log('onIceCandidate ERROR event');
		//
	}

	private onNegotiationNeeded() {
		console.log('onNegotiationNeeded event');
		//
	}

	private onTrack(event: RTCTrackEvent): void {
		// Received a remote stream
		console.log('ontrack', event.track.kind, event.track.enabled);

		this.setRemoteTrack(event.track);
	}

	private onConnectionStateChange() {
		//
	}

	private onIceConnectionStateChange() {
		//
	}

	private setRemoteTrack(track: MediaStreamTrack): void {
		console.log('setRemoteTrack');

		if (this.remoteMediaStream.getTrackById(track.id)) {
			console.log('remote track already set');
			return;
		}

		if (track.kind !== 'audio') {
			console.log('received non-audio track: ', track.kind);
			return;
		}

		this.remoteMediaStream.getAudioTracks().forEach((track) => {
			track.stop();
			this.remoteMediaStream.removeTrack(track);
		});

		this.remoteMediaStream.addTrack(track);
	}

	private async setLocalTrack(newTrack: MediaStreamTrack): Promise<void> {
		if (newTrack.kind === 'video') {
			console.log('skipping video track');
			return;
		}

		if (newTrack.kind !== 'audio') {
			console.log(newTrack);
			throw new Error('Unsupported track kind');
		}

		const sender = this.peer.getSenders().find((sender) => sender.track?.kind === newTrack.kind);
		if (!sender) {
			this.peer.addTrack(newTrack, this.localMediaStream);
			this.localMediaStream.addTrack(newTrack);
			return;
		}

		console.log('Replacing sender track');
		await sender.replaceTrack(newTrack);

		console.log('Replacing track on local media stream');
		const oldTrack = this.localMediaStream.getTracks().find((localTrack) => localTrack.kind === newTrack.kind);
		if (oldTrack) {
			oldTrack.stop();
			this.localMediaStream.removeTrack(oldTrack);
		}

		this.localMediaStream.addTrack(newTrack);
	}

	private async initializeLocalMediaStream(): Promise<void> {
		if (this.localMediaStreamInitialized) {
			return;
		}

		const mediaStream = await this.getuserMedia({ audio: true });

		const audioTracks = mediaStream.getAudioTracks();
		if (audioTracks.length) {
			await this.setLocalTrack(audioTracks[0]);
		}

		this.localMediaStreamInitialized = true;
	}
}
