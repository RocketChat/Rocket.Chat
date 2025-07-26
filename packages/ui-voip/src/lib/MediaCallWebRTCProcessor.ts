import { DeliverParams, IWebRTCProcessor, RequestParams } from '@rocket.chat/media-signaling';

export class MediaCallWebRTCProcessor implements IWebRTCProcessor {
	private peer: RTCPeerConnection;

	private iceGatheringFinished = false;

	constructor() {
		this.peer = new RTCPeerConnection();
	}

	private restartIce() {
		this.iceGatheringFinished = false;
		this.peer.restartIce();
	}

	public async createOffer({ iceRestart }: RequestParams<'offer'>): Promise<DeliverParams<'sdp'>> {
		if (iceRestart) {
			this.restartIce();
		}

		const offer = await this.peer.createOffer();
		await this.peer.setLocalDescription(offer);

		return {
			sdp: offer,
			endOfCandidates: this.iceGatheringFinished,
		};
	}

	public async createAnswer({ offer }: RequestParams<'answer'>): Promise<DeliverParams<'sdp'>> {
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

	public onIceCandidate(_cb: unknown) {
		//
	}

	public onNegotiationNeeded(_cb: unknown) {
		//
	}
}
