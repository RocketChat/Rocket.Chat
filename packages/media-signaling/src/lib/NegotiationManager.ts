import { Emitter } from '@rocket.chat/emitter';

import type { INegotiationCompatibleMediaCall, IWebRTCProcessor, NegotiationManagerEvents, NegotiationManagerConfig } from '../definition';
import { Negotiation } from './services/webrtc/Negotiation';

export class NegotiationManager {
	public readonly emitter: Emitter<NegotiationManagerEvents>;

	public get currentNegotiationId(): string | null {
		return this.currentNegotiation?.negotiationId || this.highestNegotiationId;
	}

	protected negotiations: Map<string, Negotiation>;

	/** negotiation actively being processed, null once completed */
	protected currentNegotiation: Negotiation | null;

	protected highestProcessedSequence: number;

	protected highestImpoliteSequence: number;

	protected highestSequence: number;

	protected webrtcProcessor: IWebRTCProcessor | null;

	/** id of the newest negotiation that has reached the processing state */
	protected highestNegotiationId: string | null;

	/** id of the newest negotiation, regardless of state */
	protected highestKnownNegotiationId: string | null;

	constructor(
		protected readonly call: INegotiationCompatibleMediaCall,
		protected readonly config: NegotiationManagerConfig,
	) {
		this.negotiations = new Map();
		this.currentNegotiation = null;
		this.highestProcessedSequence = 0;
		this.highestImpoliteSequence = 0;
		this.highestSequence = 0;
		this.webrtcProcessor = null;
		this.highestNegotiationId = null;
		this.highestKnownNegotiationId = null;

		this.emitter = new Emitter();
	}

	public async addNegotiation(
		negotiationId: string,
		remoteOffer: RTCSessionDescriptionInit | null = null,
		negotiationSequence: number | null = null,
	): Promise<void> {
		if (this.negotiations.has(negotiationId)) {
			return;
		}

		if (remoteOffer && remoteOffer.type !== 'offer') {
			return;
		}

		// If we are not receiving the negotiation sequence, trust that they are arriving in order.
		const sequence = negotiationSequence || this.highestSequence + 1;
		const isRemoteOffer = Boolean(remoteOffer);

		this.config.logger?.debug('NegotiationManager.addNegotiation', negotiationId, sequence, isRemoteOffer);

		const isPoliteNegotiation = isRemoteOffer !== this.isPoliteClient();
		const maxSkipSequence = isPoliteNegotiation ? this.highestSequence : this.highestImpoliteSequence;

		const negotiation = new Negotiation(
			{
				negotiationId,
				sequence,
				isPolite: isPoliteNegotiation,
				remoteOffer,
			},
			this.config.logger,
		);

		if (sequence <= maxSkipSequence) {
			negotiation.end();
		}

		this.addToQueue(negotiation);

		return this.processNegotiations();
	}

	public async setRemoteDescription(
		negotiationId: string,
		remoteDescription: RTCSessionDescriptionInit,
		negotiationSequence: number | null = null,
	): Promise<void> {
		if (remoteDescription.type === 'offer') {
			return this.addNegotiation(negotiationId, remoteDescription, negotiationSequence);
		}

		this.config.logger?.debug('NegotiationManager.setRemoteDescription', negotiationId);

		if (this.currentNegotiation?.negotiationId !== negotiationId) {
			this.config.logger?.warn('Received remote description for an unexpected negotiation');
			this.emitter.emit('error', { errorCode: 'not-current-negotiation', negotiationId });
			return;
		}

		try {
			return this.currentNegotiation.setRemoteAnswer(remoteDescription);
		} catch (e) {
			this.config.logger?.error(e);
			this.currentNegotiation = null;
			this.emitter.emit('error', { errorCode: 'failed-to-set-remote-answer', negotiationId });
		}
	}

	public setWebRTCProcessor(webrtcProcessor: IWebRTCProcessor) {
		this.config.logger?.debug('NegotiationManager.setWebRTCProcessor');
		this.webrtcProcessor = webrtcProcessor;

		this.webrtcProcessor.emitter.on('internalError', (event) => this.onWebRTCInternalError(event));
		this.webrtcProcessor.emitter.on('negotiationNeeded', () => this.onWebRTCNegotiationNeeded());
	}

	public async processNegotiations(): Promise<void> {
		this.config.logger?.debug('NegotiationManager.processNegotiations');
		if (!this.isConfigured()) {
			return;
		}

		if (this.currentNegotiation) {
			return;
		}

		const nextNegotiation = this.getNextInQueue();
		if (!nextNegotiation) {
			return;
		}

		await this.processNegotiation(nextNegotiation);
	}

	protected isPoliteClient(): boolean {
		return this.call.role === 'callee';
	}

	protected addToQueue(negotiation: Negotiation): void {
		this.config.logger?.debug('NegotiationManager.addToQueue', negotiation.negotiationId);

		if (negotiation.sequence > this.highestSequence) {
			this.highestSequence = negotiation.sequence;
			this.highestKnownNegotiationId = negotiation.negotiationId;
		}
		this.negotiations.set(negotiation.negotiationId, negotiation);

		if (!negotiation.ended) {
			if (!negotiation.isPolite) {
				if (negotiation.sequence > this.highestImpoliteSequence) {
					this.highestImpoliteSequence = negotiation.sequence;
				}

				if (this.currentNegotiation?.isPolite) {
					this.currentNegotiation.end();
					this.currentNegotiation = null;
				}
			}
		}
	}

	protected getNextInQueue(): Negotiation | null {
		for (const negotiation of this.negotiations.values()) {
			// Skip negotiations that have already started processing or been skipped
			if (negotiation.ended || negotiation.started || negotiation.sequence <= this.highestProcessedSequence) {
				continue;
			}

			// Skip negotiations that can be fulfilled by some newer negotiation
			if (negotiation.sequence < this.highestImpoliteSequence) {
				negotiation.end();
				continue;
			}

			// Polite negotiations are only processed if there's nothing else queued
			if (negotiation.isPolite && negotiation.sequence < this.highestSequence) {
				negotiation.end();
				continue;
			}

			return negotiation;
		}

		return null;
	}

	protected async processNegotiation(this: WebRTCNegotiationManager, negotiation: Negotiation): Promise<void> {
		this.config.logger?.debug('NegotiationManager.processNegotiation', negotiation.negotiationId);

		this.currentNegotiation = negotiation;
		this.highestProcessedSequence = negotiation.sequence;
		this.highestNegotiationId = negotiation.negotiationId;

		negotiation.emitter.on('ended', () => {
			if (this.currentNegotiation !== negotiation) {
				return;
			}

			this.config.logger?.debug('NegotiationManager.processNegotiation.ended');
			this.currentNegotiation = null;
			void this.processNegotiations();
		});

		negotiation.emitter.on('error', ({ errorCode }) => {
			this.config.logger?.error('Negotiation error', errorCode);
			this.emitter.emit('error', { errorCode, negotiationId: negotiation.negotiationId });
		});

		negotiation.emitter.on('local-sdp', ({ sdp }) => {
			this.config.logger?.debug('NegotiationManager.processNegotiation.local-sdp');
			this.emitter.emit('local-sdp', { sdp, negotiationId: negotiation.negotiationId });
		});

		try {
			return negotiation.process(this.webrtcProcessor);
		} catch (e) {
			this.config.logger?.error(e);
			this.currentNegotiation = null;
			this.emitter.emit('error', { errorCode: 'failed-to-process-negotiation', negotiationId: negotiation.negotiationId });
		}
	}

	protected isConfigured(): this is WebRTCNegotiationManager {
		if (this.call.state === 'hangup' || this.call.hidden) {
			this.config.logger?.debug('Ignoring WebRTC negotiations due to call state.');
			return false;
		}

		if (!this.webrtcProcessor) {
			this.config.logger?.debug('Delaying WebRTC negotiations due to missing processor.');
			return false;
		}

		// Wait for the input track before negotiating, to avoid potentially having to renegotiate immediately
		if (!this.call.hasInputTrack()) {
			this.config.logger?.debug('Delaying WebRTC negotiations due to missing input track.');
			return false;
		}

		return true;
	}

	protected isFulfillingNegotiationQueued(): boolean {
		// If we're a polite client, then any queued negotiation is enough to fulfill our negotiation needs
		if (this.isPoliteClient()) {
			return this.highestSequence > this.highestProcessedSequence;
		}

		// If there's an impolite negotiation queued, that's good enough for any client
		return this.highestImpoliteSequence > this.highestProcessedSequence;
	}

	protected onWebRTCNegotiationNeeded(): void {
		this.config.logger?.debug('NegotiationManager.onWebRTCNegotiationNeeded');
		if (!this.isConfigured()) {
			return;
		}

		// If we haven't processed any negotiation yet, then we can ignore any negotiation request
		if (!this.highestNegotiationId || !this.highestKnownNegotiationId) {
			return;
		}

		// If we already have a queued negotiation that would fulfill this need, then don't do anything
		if (this.isFulfillingNegotiationQueued()) {
			return;
		}

		// When requesting a renegotiation, always use the newest negotiation id we know that doesn't fulfill our need
		this.emitter.emit('negotiation-needed', { oldNegotiationId: this.highestKnownNegotiationId });
	}

	protected onWebRTCInternalError({ critical, error }: { critical: boolean; error: string | Error; errorDetails?: string }): void {
		this.config.logger?.debug('NegotiationManager.onWebRTCInternalError', critical, error);
		const errorCode = typeof error === 'object' ? error.message : error;

		const negotiationId = this.currentNegotiationId;

		if (negotiationId) {
			this.emitter.emit('error', { errorCode, negotiationId });
		}
	}
}

abstract class WebRTCNegotiationManager extends NegotiationManager {
	protected abstract override webrtcProcessor: IWebRTCProcessor;
}
