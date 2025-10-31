import type { IClientMediaCall, IWebRTCProcessor } from '../definition';
import { Negotiation } from './services/webrtc/Negotiation';

export class NegotiationManager {
	protected negotiations: Map<string, Negotiation>;

	/** negotiation actively being processed, null once completed */
	protected currentNegotiation: Negotiation | null;

	protected highestProcessedSequence: number;

	protected highestImpoliteSequence: number;

	protected highestSequence: number;

	protected webrtcProcessor: IWebRTCProcessor | null;

	constructor(protected readonly call: IClientMediaCall) {
		this.negotiations = new Map();
		this.currentNegotiation = null;
		this.highestProcessedSequence = 0;
		this.highestImpoliteSequence = 0;
		this.highestSequence = 0;
		this.webrtcProcessor = null;
	}

	public async addNegotiation(
		negotiationId: string,
		sequence: number,
		remoteOffer: RTCSessionDescriptionInit | null = null,
	): Promise<void> {
		if (this.negotiations.has(negotiationId)) {
			return;
		}

		const isRemoteOffer = Boolean(remoteOffer);
		const isPoliteClient = this.call.role === 'callee';
		const isPoliteNegotiation = isRemoteOffer !== isPoliteClient;
		const baseSequence = isPoliteNegotiation ? this.highestSequence : this.highestImpoliteSequence;

		const negotiation = new Negotiation({
			negotiationId,
			sequence,
			isPolite: isPoliteNegotiation,
			remoteOffer,
		});

		if (sequence < baseSequence) {
			negotiation.skip();
		}

		return this.processNegotiations();
	}

	public async processNegotiations(): Promise<void> {
		if (!this.isConfigured()) {
			return;
		}

		const nextNegotiation = this.getNextInQueue();
		if (!nextNegotiation) {
			return;
		}

		try {
			await this.processNegotiation(nextNegotiation);
		} catch {
			// TODO
		}

		// Once the negotiation is complete, check the queue again
		if (!this.currentNegotiation) {
			return this.processNegotiations();
		}
	}

	protected addToQueue(negotiation: Negotiation): void {
		this.highestSequence = Math.max(this.highestSequence, negotiation.sequence);
		this.negotiations.set(negotiation.negotiationId, negotiation);

		if (!negotiation.skipped && !negotiation.isPolite) {
			this.highestImpoliteSequence = Math.max(this.highestImpoliteSequence, negotiation.sequence);

			if (this.currentNegotiation?.isPolite) {
				this.currentNegotiation.skip();
				this.currentNegotiation = null;
			}
		}

		this.negotiations.set(negotiation.negotiationId, negotiation);
	}

	protected getNextInQueue(): Negotiation | null {
		if (this.currentNegotiation) {
			return null;
		}

		for (const negotiation of this.negotiations.values()) {
			// Skip negotiations that have already started processing or been skipped
			if (negotiation.skipped || negotiation.started || negotiation.sequence <= this.highestProcessedSequence) {
				continue;
			}

			// Skip negotiations that can be fullfilled by some newer negotiation
			if (negotiation.sequence < this.highestImpoliteSequence) {
				negotiation.skip();
				continue;
			}

			// Polite negotiations are only processed if there's nothing else queued
			if (negotiation.isPolite && negotiation.sequence < this.highestSequence) {
				negotiation.skip();
				continue;
			}

			return negotiation;
		}

		return null;
	}

	protected async processNegotiation(this: WebRTCNegotiationManager, negotiation: Negotiation): Promise<void> {
		this.currentNegotiation = negotiation;
		this.highestProcessedSequence = negotiation.sequence;

		negotiation.emitter.on('completed', () => {
			if (this.currentNegotiation !== negotiation) {
				return;
			}

			this.currentNegotiation = null;
		});

		negotiation.emitter.on('skipped', () => {
			if (this.currentNegotiation !== negotiation) {
				return;
			}

			this.currentNegotiation = null;
		});

		negotiation.emitter.on('local-sdp', ({ sdp }) => {
			if (this.currentNegotiation !== negotiation) {
				return;
			}

			//
		});

		return negotiation.process(this.webrtcProcessor);
	}

	protected isConfigured(): this is WebRTCNegotiationManager {
		return Boolean(this.webrtcProcessor);
	}
}

abstract class WebRTCNegotiationManager extends NegotiationManager {
	protected abstract webrtcProcessor: IWebRTCProcessor;
}
