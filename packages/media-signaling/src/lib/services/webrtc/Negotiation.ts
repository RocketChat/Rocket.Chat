import { Emitter } from '@rocket.chat/emitter';

import type { IMediaSignalLogger, IWebRTCProcessor, NegotiationData, NegotiationEvents } from '../../../definition';

export class Negotiation {
	public readonly emitter: Emitter<NegotiationEvents>;

	public get started() {
		return this._startedProcessing;
	}

	/** Returns true when the negotiation will no longer process anything, no matter the reason */
	public get ended() {
		return this._ended;
	}

	public get isLocal(): boolean {
		return !this.remoteOffer;
	}

	public get finished(): boolean {
		return this._finished;
	}

	public readonly negotiationId: string;

	public readonly sequence: number;

	public readonly isPolite: boolean;

	protected webrtcProcessor: IWebRTCProcessor | null;

	protected remoteOffer: RTCSessionDescriptionInit | null;

	protected _ended: boolean;

	protected _startedProcessing: boolean;

	protected _failed: boolean;

	protected _finished: boolean;

	constructor(
		negotiation: NegotiationData,
		protected readonly logger?: IMediaSignalLogger | null,
	) {
		this.webrtcProcessor = null;
		this._startedProcessing = false;
		this._ended = false;
		this._failed = false;
		this._finished = false;
		this.negotiationId = negotiation.negotiationId;
		this.sequence = negotiation.sequence;
		this.isPolite = negotiation.isPolite;
		this.remoteOffer = negotiation.remoteOffer;

		this.emitter = new Emitter();
	}

	public end(finished = false): void {
		if (this._ended) {
			return;
		}

		this.logger?.debug('Negotiation.end', this.negotiationId);
		this._ended = true;
		if (finished && this._startedProcessing && !this._failed) {
			this._finished = true;
		}
		this.emitter.emit('ended');
	}

	public async process(webrtcProcessor: IWebRTCProcessor): Promise<void> {
		if (this._startedProcessing) {
			return;
		}
		this.logger?.debug('Negotiation.process', this.negotiationId);

		this.setWebRTCProcessor(webrtcProcessor);
		this._startedProcessing = true;

		if (this.remoteOffer) {
			await this.createLocalAnswer(this.remoteOffer);
			return;
		}

		// after creating the local offer, this negotiation will remain active until it receives an answer
		await this.createLocalOffer();
	}

	public async setRemoteAnswer(sdp: RTCSessionDescriptionInit): Promise<void> {
		if (!this.isWebRTCNegotiation()) {
			return;
		}

		this.logger?.debug('Negotiation.setRemoteAnswer', this.negotiationId);

		if (!this.isLocal || !this._startedProcessing || sdp.type !== 'answer') {
			this.logger?.warn('Invalid negotiation workflow');
			return;
		}

		await this.setPeerRemoteDescription(sdp);
		// Local negotiations end when the remote description is available
		this.end(true);
	}

	protected async setLocalDescription(this: WebRTCNegotiation, sdp: RTCSessionDescriptionInit): Promise<void> {
		this.logger?.debug('Negotiation.setLocalDescription', this.negotiationId);

		this.assertNegotiationIsActive();
		await this.setPeerLocalDescription(sdp);

		this.assertNegotiationIsActive();
		await this.webrtcProcessor.waitForIceGathering();

		this.assertNegotiationIsActive();
		const localDescription = this.getPeerLocalDescription();

		this.emitter.emit('local-sdp', { sdp: localDescription });

		// Remote negotiations end when the local description is available
		if (!this.isLocal) {
			this.end(true);
		}
	}

	protected setWebRTCProcessor(webrtcProcessor: IWebRTCProcessor): asserts this is WebRTCNegotiation {
		this.webrtcProcessor = webrtcProcessor;
	}

	protected isWebRTCNegotiation(): this is WebRTCNegotiation {
		return !!this.webrtcProcessor;
	}

	protected assertNegotiationIsActive(): void {
		if (this._ended) {
			this.fail('skipped-negotiation');
			throw new Error('Skipped Negotiation');
		}
	}

	protected async createLocalOffer(this: WebRTCNegotiation): Promise<void> {
		this.logger?.debug('Negotiation.createLocalOffer', this.negotiationId);
		this.assertNegotiationIsActive();

		const earlyOffer = await this.webrtcProcessor.createOffer({});

		await this.setLocalDescription(earlyOffer);
	}

	protected async createLocalAnswer(this: WebRTCNegotiation, remoteOffer: RTCSessionDescriptionInit): Promise<void> {
		this.logger?.debug('Negotiation.createLocalAnswer', this.negotiationId);
		this.assertNegotiationIsActive();
		await this.setPeerRemoteDescription(remoteOffer);

		this.assertNegotiationIsActive();
		const earlyAnswer = await this.createEarlyAnswer();

		this.assertNegotiationIsActive();
		await this.setLocalDescription(earlyAnswer);
	}

	protected fail(errorCode: string): void {
		if (this._failed || this._ended) {
			return;
		}

		this.emitter.emit('error', { errorCode });

		this._failed = true;
	}

	protected async setPeerRemoteDescription(this: WebRTCNegotiation, remoteDescription: RTCSessionDescriptionInit): Promise<void> {
		try {
			await this.webrtcProcessor.setRemoteDescription(remoteDescription);
		} catch (err) {
			this.logger?.error(err);
			this.fail('failed-to-set-remote-description');
		}
	}

	protected async createEarlyAnswer(this: WebRTCNegotiation): Promise<RTCSessionDescriptionInit> {
		try {
			const earlyAnswer = await this.webrtcProcessor.createAnswer();
			return earlyAnswer;
		} catch (err) {
			this.logger?.error(err);
			this.fail('failed-to-create-local-answer');
			throw err;
		}
	}

	protected async setPeerLocalDescription(this: WebRTCNegotiation, localDescription: RTCSessionDescriptionInit): Promise<void> {
		try {
			await this.webrtcProcessor.setLocalDescription(localDescription);
		} catch (err) {
			this.logger?.error(err);
			this.fail('failed-to-set-local-description');
		}
	}

	protected getPeerLocalDescription(this: WebRTCNegotiation): RTCSessionDescriptionInit {
		try {
			const sdp = this.webrtcProcessor.getLocalDescription();
			if (!sdp) {
				throw new Error('No local description');
			}
			return sdp;
		} catch (err) {
			this.logger?.error(err);
			this.fail('failed-to-get-local-description');
			throw err;
		}
	}
}

export abstract class WebRTCNegotiation extends Negotiation {
	protected abstract override webrtcProcessor: IWebRTCProcessor;
}
