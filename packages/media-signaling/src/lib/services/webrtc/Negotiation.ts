import { Emitter } from '@rocket.chat/emitter';

import type { IWebRTCProcessor } from '../../../definition';

type NegotiationEvents = {
	'error': void;
	'skipped': void;
	'completed': void;
	'local-sdp': { sdp: RTCSessionDescriptionInit };
};

type NegotiationData = {
	negotiationId: string;
	sequence: number;
	isPolite: boolean;

	remoteOffer: RTCSessionDescriptionInit | null;
}

export class Negotiation {
	public emitter: Emitter<NegotiationEvents>;

	public get skipped() {
		return this._skipped || this._aborted;
	}

	public get aborted() {
		return this._aborted;
	}

	public get started() {
		return this._startedProcessing;
	}

	/** Returns true when the whole process around the negotiation is complete */
	public get completed() {
		return this._completed;
	}

	/** Returns true when the negotiation signaling is stable */
	public get hasAnswer() {
		return this._hasAnswer;
	}

	public readonly negotiationId: string;

	public readonly sequence: number;

	public readonly isPolite: boolean;

	protected webrtcProcessor: IWebRTCProcessor | null;

	protected remoteOffer: RTCSessionDescriptionInit | null;

	protected _skipped: boolean;

	protected _aborted: boolean;

	protected _completed: boolean;

	protected _startedProcessing: boolean;

	protected _hasAnswer: boolean;

	constructor(negotiation: NegotiationData) {
		this._skipped = false;
		this._aborted = false;
		this.webrtcProcessor = null;
		this._startedProcessing = false;
		this._completed = false;
		this._hasAnswer = false;
		this.negotiationId = negotiation.negotiationId;
		this.sequence = negotiation.sequence;
		this.isPolite = negotiation.isPolite;
		this.remoteOffer = negotiation.remoteOffer;

		this.emitter = new Emitter();
	}

	/**
	 * If the internal negotiation is still pending, abort all processing;
	 * If the negotiation is complete but signaling isn't, continue with signaling.
	 * */
	public skip(): void {
		if (this._skipped) {
			return;
		}

		this._skipped = true;
		if (!this._hasAnswer) {
			this._aborted = true;
		}

		if (!this.complete) {
			this.emitter.emit('skipped');
		}
	}

	/**
	 * Abort any and all processing in this negotiation
	 * */
	public abort(): void {
		if (this._completed) {
			return;
		}

		this._aborted = true;
		this._skipped = true;

		this.emitter.emit('skipped');
	}

	public async process(webrtcProcessor: IWebRTCProcessor): Promise<void> {
		if (this._startedProcessing) {
			return;
		}

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
		if (!this.webrtcProcessor) {
			return;
		}

		if (!this.remoteOffer || !this._startedProcessing) {
			throw new Error('invalid-workflow');
		}

		if (sdp.type !== 'answer') {
			throw new Error('invalid-sdp-type');
		}

		await this.webrtcProcessor.setRemoteDescription(sdp);
		this._hasAnswer = true;
		this.complete();
	}

	protected async setLocalDescription(this: WebRTCNegotiation, sdp: RTCSessionDescriptionInit): Promise<void> {
		this.assertNegotiationIsNotAborted();
		await this.webrtcProcessor.setLocalDescription(sdp);
		if (sdp.type === 'answer') {
			this._hasAnswer = true;
		}

		this.assertNegotiationIsNotAborted();
		await this.webrtcProcessor.waitForIceGathering();

		this.assertNegotiationIsNotAborted();
		const localDescription = this.webrtcProcessor.getLocalDescription();
		if (!localDescription) {
			throw new Error('implementation-error');
		}

		this.emitter.emit('local-sdp', { sdp: localDescription });
		this.complete();
	}

	protected setWebRTCProcessor(webrtcProcessor: IWebRTCProcessor): asserts this is WebRTCNegotiation {
		this.webrtcProcessor = webrtcProcessor;
	}

	protected assertNegotiationIsNotAborted(): void {
		if (this.aborted) {
			throw new Error('Aborted Negotiation');
		}
	}

	protected async createLocalOffer(this: WebRTCNegotiation): Promise<void> {
		this.assertNegotiationIsNotAborted();

		const earlyOffer = await this.webrtcProcessor.createOffer({});

		await this.setLocalDescription(earlyOffer);
	}

	protected async createLocalAnswer(this: WebRTCNegotiation, remoteOffer: RTCSessionDescriptionInit): Promise<void> {
		this.assertNegotiationIsNotAborted();
		await this.webrtcProcessor.setRemoteDescription(remoteOffer);

		this.assertNegotiationIsNotAborted();
		const earlyAnswer = await this.webrtcProcessor.createAnswer();

		this.assertNegotiationIsNotAborted();
		await this.setLocalDescription(earlyAnswer);
	}

	protected complete(): void {
		this._completed = true;
		this.emitter.emit('completed');
	}
}

export abstract class WebRTCNegotiation extends Negotiation {
	protected abstract webrtcProcessor: IWebRTCProcessor;
}
