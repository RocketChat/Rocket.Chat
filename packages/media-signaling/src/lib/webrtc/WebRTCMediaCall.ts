import type { IWebRTCProcessor } from '../../definition/IWebRTCProcessor';
import type { DeliverParams } from '../../definition/MediaSignalDeliver';
import type { RequestParams } from '../../definition/MediaSignalRequest';

export class WebRTCMediaCall implements IWebRTCProcessor {
	// #ToDo peer instance state
	private peer: RTCPeerConnection;

	private iceGatheringFinished = false;

	private restartIce() {
		this.iceGatheringFinished = false;

		this.peer.restartIce();
	}

	constructor() {
		//
	}

	public async initializePeerConnection(configuration?: RTCConfiguration): Promise<void> {
		this.peer = new RTCPeerConnection(configuration);
	}

	// private onTrack(event) {
	// 	//
	// }

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

	public onIceCandidate(cb: unknown) {
		//
	}

	public onNegotiationNeeded(cb: unknown) {
		//
	}
}
