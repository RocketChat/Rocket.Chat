import { Emitter } from '@rocket.chat/emitter';

import type { MediaSignalTransportWrapper } from './TransportWrapper';
import type { IWebRTCProcessor } from '../definition/IWebRTCProcessor';
import type { MediaSignal, MediaSignalSDP, MediaSignalType } from '../definition/MediaSignal';
import type {
	IClientMediaCall,
	IClientMediaCallData,
	CallEvents,
	CallContact,
	CallRole,
	CallState,
	CallService,
	CallHangupReason,
} from '../definition/call';
import { signalTypeRequiresTargeting } from './utils/signalTypeRequiresTargeting';

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

	private firstSignal: MediaSignal<'new'>;

	private acceptedLocally: boolean;

	private endedLocally: boolean;

	// private timeoutHandler?: ReturnType<typeof setTimeout>;

	constructor(
		config: IClientMediaCallConfig,
		signal: MediaSignal<'new'>,
		{ ignored, contact }: Pick<IClientMediaCallData, 'ignored' | 'contact'> = {},
	) {
		this.emitter = new Emitter<CallEvents>();

		this.firstSignal = signal;

		this.transporter = config.transporter;
		this.webrtcProcessor = config.webrtcProcessor;

		this.callId = signal.callId;
		this._role = signal.body.role;
		this._service = signal.body.service;

		this.acceptedLocally = false;
		this.endedLocally = false;
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

	public async processSignal<T extends MediaSignalType>(signal: MediaSignal<T>) {
		console.log('ClientMediaCall.processSignal', signal.type);

		if (!signal.sessionId && signalTypeRequiresTargeting(signal.type)) {
			console.error(`Received an untargeted ${signal.type} signal.`);
			return;
		}

		switch (signal.type) {
			case 'sdp':
				return this.processRemoteSDP(signal as MediaSignal<'sdp'>);
			case 'request-offer':
				return this.processOfferRequest(signal as MediaSignal<'request-offer'>);
			case 'notification':
				return this.processNotification(signal as MediaSignal<'notification'>);
		}

		console.log('signal ignored, as its type is not handled by this agent', signal.type);
	}

	public async accept(): Promise<void> {
		console.log('call.accept');
		if (!this.isPendingAcceptance()) {
			throw new Error('call-not-pending-acceptance');
		}
		this.acceptedLocally = true;
		this.transporter.answer(this.callId, 'accept');
	}

	public async reject(): Promise<void> {
		console.log('call.reject');
		if (!this.isPendingAcceptance()) {
			throw new Error('call-not-pending-acceptance');
		}
		this.transporter.answer(this.callId, 'reject');
	}

	public async hangup(): Promise<void> {
		console.log('call.hangup');
		if (this.endedLocally || this._state === 'hangup') {
			return;
		}

		this.endedLocally = true;
		await this.flagAsEnded('normal');
	}

	public isPendingAcceptance(): boolean {
		return ['none', 'ringing'].includes(this._state);
	}

	private initialize(signal: MediaSignal<'new'>): void {
		console.log('call.initialize');
		// If it's flagged as ignored even before the initialization, tell the server we're unavailable
		if (this.ignored) {
			return this.transporter.answer(signal.callId, 'unavailable');
		}

		// If the call is targeted, assume we already accepted it:
		if (signal.sessionId) {
			this.acceptedLocally = true;
		}
		this._state = 'ringing';

		// Send an ACK so the server knows that this session exists and is reachable
		this.transporter.answer(signal.callId, 'ack');
	}

	private changeState(newState: CallState): void {
		if (newState === this._state) {
			return;
		}

		console.log('call.changeState', newState);

		const oldState = this._state;
		this._state = newState;
		this.emitter.emit('stateChange', oldState);

		switch (newState) {
			case 'accepted':
				this.emitter.emit('accepted');
				break;
			case 'hangup':
				this.emitter.emit('ended');
				break;
		}
	}

	private async processOfferRequest(signal: MediaSignal<'request-offer'>) {
		console.log('call.processOfferRequest');
		if (!signal.sessionId) {
			console.error('Received an untargeted offer request.');
			return;
		}

		let offer: MediaSignalSDP | null = null;
		try {
			offer = await this.webrtcProcessor.createOffer(signal.body);
		} catch (e) {
			this.transporter.sendError(this.callId, 'failed-to-create-offer');
			throw e;
		}

		if (!offer) {
			this.transporter.sendError(this.callId, 'implementation-error');
		}

		await this.deliverSdp(offer);
	}

	private async processAnswerRequest(signal: MediaSignal<'sdp'>) {
		console.log('Call.processAnswerRequest');
		let answer: MediaSignalSDP | null = null;
		try {
			answer = await this.webrtcProcessor.createAnswer(signal.body);
		} catch (e) {
			this.transporter.sendError(this.callId, 'failed-to-create-answer');
			throw e;
		}

		if (!answer) {
			this.transporter.sendError(this.callId, 'implementation-error');
		}

		await this.deliverSdp(answer);
	}

	private async processRemoteSDP(signal: MediaSignal<'sdp'>) {
		console.log('Call.processRemoteSDP');
		if (signal.body.sdp.type === 'offer') {
			return this.processAnswerRequest(signal);
		}

		await this.webrtcProcessor.setRemoteDescription(signal.body);
	}

	private async deliverSdp(sdp: MediaSignalSDP) {
		console.log('Call.deliverSdp');

		return this.transporter.sendToServer(this.callId, 'sdp', sdp);
	}

	private async processNotification(signal: MediaSignal<'notification'>) {
		console.log('Call.processNotification', signal.body.notification);

		switch (signal.body.notification) {
			case 'accepted':
				return this.flagAsAccepted();
			case 'hangup':
				return this.flagAsEnded('remote');
		}

		console.log('notification ignored as its type is not handled by this agent', signal.body.notification);
	}

	private async flagAsAccepted(): Promise<void> {
		console.log('flagAsAccepted');

		if (!this.acceptedLocally) {
			this.transporter.sendError(this.callId, 'not-accepted');
			throw new Error('Trying to activate a call that was not yet accepted locally.');
		}

		// Both sides of the call have accepted it, we can change the state now
		this.changeState('accepted');
	}

	private async flagAsEnded(reasonCode: CallHangupReason): Promise<void> {
		console.log('flagAsEnded');

		if (this._state === 'hangup') {
			return;
		}

		this.transporter.hangup(this.callId, reasonCode);

		this.changeState('hangup');
	}
}
