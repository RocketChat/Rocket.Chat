import { Emitter } from '@rocket.chat/emitter';

import type { MediaSignalTransportWrapper } from './TransportWrapper';
import type { IWebRTCProcessor } from '../definition/IWebRTCProcessor';
import type { IClientMediaCall, IClientMediaCallData, CallEvents, CallContact, CallRole, CallState, CallService } from '../definition/call';
import type { MediaSignalRequest, MediaSignal, DeliverParams, MediaSignalDeliver, MediaSignalNotify } from '../definition/signal';

export interface IClientMediaCallConfig {
	transporter: MediaSignalTransportWrapper;
	webrtcProcessor: IWebRTCProcessor;
}

export class ClientMediaCall implements IClientMediaCall {
	public readonly callId: string;

	public readonly emitter: Emitter<CallEvents>;

	private _role: CallRole;

	public get role(): CallRole {
		return this._role;
	}

	private _state: CallState;

	public get state(): CallState {
		return this._state;
	}

	private _ignored: boolean;

	public get ignored(): boolean {
		return this._ignored;
	}

	private _contact: CallContact;

	public get contact(): CallContact {
		return this._contact;
	}

	private _service: CallService;

	public get service(): CallService {
		return this._service;
	}

	private transporter: MediaSignalTransportWrapper;

	private webrtcProcessor: IWebRTCProcessor;

	private tricklingSignals = new Set<MediaSignal>();

	private firstSignal: MediaSignalNotify<'new'>;

	private acceptedLocally: boolean;

	// private timeoutHandler?: ReturnType<typeof setTimeout>;

	constructor(
		config: IClientMediaCallConfig,
		signal: MediaSignalNotify<'new'>,
		{ ignored, contact }: Pick<IClientMediaCallData, 'ignored' | 'contact'> = {},
	) {
		this.emitter = new Emitter<CallEvents>();

		this.firstSignal = signal;

		this.transporter = config.transporter;
		this.webrtcProcessor = config.webrtcProcessor;

		this.callId = signal.callId;
		this._role = signal.role;
		this._service = signal.body.service;

		this.acceptedLocally = false;
		this._state = 'none';
		this._ignored = ignored || false;
		this._contact = contact || null;

		this.initialize(this.firstSignal);
	}

	public getRemoteMediaStream(): MediaStream {
		return this.webrtcProcessor.getRemoteMediaStream();
	}

	public setContact(contact: CallContact): void {
		if (!contact) {
			return;
		}

		this._contact = {
			...this._contact,
			...contact,
		};
		this.emitter.emit('contactUpdate');
	}

	public async processSignal(signal: MediaSignal) {
		console.log('ClientMediaCall.processSignal', signal);
		switch (signal.type) {
			case 'request':
				await this.processRequest(signal);
				break;
			case 'deliver':
				await this.processDeliver(signal);
				break;
			case 'notify':
				await this.processNotify(signal);
				break;
		}
	}

	public async accept(): Promise<void> {
		if (!this.isPendingAcceptance()) {
			throw new Error('call-not-pending-acceptance');
		}
		this.acceptedLocally = true;
		this.transporter.notifyServer(this.firstSignal, 'accept');
	}

	public async reject(): Promise<void> {
		if (!this.isPendingAcceptance()) {
			throw new Error('call-not-pending-acceptance');
		}
		this.transporter.notifyServer(this.firstSignal, 'reject');
	}

	public async hangup(): Promise<void> {
		this.transporter.notifyServer(this.firstSignal, 'hangup', {
			reasonCode: 'normal',
		});
	}

	public isPendingAcceptance(): boolean {
		return ['none', 'ringing'].includes(this._state);
	}

	private initialize(signal: MediaSignalNotify<'new'>): void {
		// If it's flagged as ignored even before the initialization, tell the server we're unavailable
		if (this.ignored) {
			return this.transporter.notifyServer(signal, 'unavailable');
		}

		// If the call is targeted, assume we already accepted it:
		if (signal.sessionId) {
			this.acceptedLocally = true;
		}
		this._state = 'ringing';

		// Send an ACK so the server knows that this session exists and is reachable
		this.transporter.notifyServer(signal, 'ack');
	}

	private changeState(newState: CallState): void {
		if (newState === this._state) {
			return;
		}

		const oldState = this._state;
		this._state = newState;
		this.emitter.emit('stateChange', oldState);

		if (newState === 'accepted') {
			this.emitter.emit('accepted');
		}
	}

	private async processRequest(signal: MediaSignalRequest) {
		if (!signal.sessionId) {
			console.error('Received an untargeted request.');
			return;
		}

		switch (signal.body.request) {
			case 'offer':
				return this.processOfferRequest(signal as MediaSignalRequest<'offer'>);
			case 'answer':
				return this.processAnswerRequest(signal as MediaSignalRequest<'answer'>);
			case 'sdp':
				return this.processSdpRequest(signal as MediaSignalRequest<'sdp'>);
		}
	}

	private async processOfferRequest(signal: MediaSignalRequest<'offer'>) {
		// #ToDo: processor
		let offer: DeliverParams<'sdp'> | null = null;
		try {
			offer = await this.webrtcProcessor.createOffer(signal.body);
		} catch (e) {
			this.transporter.sendError(signal, 'failed-to-create-offer');
			throw e;
		}

		if (!offer) {
			this.transporter.sendError(signal, 'implementation-error');
		}

		await this.deliverSdp(signal, offer);
	}

	private async processAnswerRequest(signal: MediaSignalRequest<'answer'>) {
		let answer: DeliverParams<'sdp'> | null = null;
		try {
			answer = await this.webrtcProcessor.createAnswer(signal.body);
		} catch (e) {
			this.transporter.sendError(signal, 'failed-to-create-answer');
			throw e;
		}

		if (!answer) {
			this.transporter.sendError(signal, 'implementation-error');
		}

		await this.deliverSdp(signal, answer);
	}

	private async processSdpRequest(signal: MediaSignalRequest<'sdp'>) {
		let sdp: DeliverParams<'sdp'> | null = null;
		try {
			sdp = await this.webrtcProcessor.collectLocalDescription(signal.body);
		} catch (e) {
			this.transporter.sendError(signal, 'failed-to-collect-description');
			throw e;
		}

		if (!sdp) {
			this.transporter.sendError(signal, 'implementation-error');
		}

		await this.deliverSdp(signal, sdp);
	}

	private async deliverSdp(requestSignal: MediaSignal, sdp: DeliverParams<'sdp'>) {
		// If we're trickling ICE, keep the signal reference for upcoming candidates
		if (!sdp.endOfCandidates) {
			this.tricklingSignals.add(requestSignal);
		}

		return this.transporter.deliverToServer(requestSignal, 'sdp', sdp);
	}

	private async processDeliver(signal: MediaSignalDeliver) {
		if (!signal.sessionId) {
			throw new Error('Delivery signals MUST target a specific session.');
		}

		switch (signal.body.deliver) {
			case 'sdp':
				await this.webrtcProcessor.setRemoteDescription(signal.body);
				break;
			case 'ice-candidates':
				await this.webrtcProcessor.addIceCandidates(signal.body);
				break;
			case 'dtmf':
				// #ToDo
				break;
		}
	}

	private async processNotify(signal: MediaSignalNotify) {
		switch (signal.body.notify) {
			case 'new':
				break;
			case 'error':
				break;
			case 'ack':
				break;
			// case 'invalid':
			// 	break;
			// case 'unable':
			// 	break;
			// case 'empty':
			// 	break;
			case 'state':
				break;
			case 'unavailable':
				break;
			case 'accept':
				await this.flagAsAccepted(signal);
				break;
			case 'reject':
				break;
			case 'hangup':
				break;
			case 'negotiation-needed':
				break;
		}
	}

	private async flagAsAccepted(signal: MediaSignalNotify): Promise<void> {
		if (!this.acceptedLocally) {
			this.transporter.sendError(signal, 'not-accepted');
			throw new Error('Trying to activate a call that was not yet accepted locally.');
		}

		// Both sides of the call have accepted it, we can change the state now
		this.changeState('accepted');
	}
}
