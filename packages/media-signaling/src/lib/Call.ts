import { Emitter } from '@rocket.chat/emitter';

import type { MediaSignalTransportWrapper } from './TransportWrapper';
import type { IServiceProcessorFactoryList } from '../definition';
import type { IWebRTCProcessor } from '../definition/IWebRTCProcessor';
import type { MediaSignal, MediaSignalSDP } from '../definition/MediaSignal';
import type { IClientMediaCall, CallEvents, CallContact, CallRole, CallState, CallService, CallHangupReason } from '../definition/call';
import { signalTypeRequiresTargeting } from './utils/signalTypeRequiresTargeting';
import type { MediaStreamFactory } from '../definition/MediaStreamFactory';

export interface IClientMediaCallConfig {
	transporter: MediaSignalTransportWrapper;
	processorFactories: IServiceProcessorFactoryList;
	mediaStreamFactory: MediaStreamFactory;
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

	private _service: CallService | null;

	public get service(): CallService | null {
		return this._service;
	}

	protected webrtcProcessor: IWebRTCProcessor | null = null;

	private acceptedLocally: boolean;

	private endedLocally: boolean;

	private hasRemoteData: boolean;

	private acknowledged: boolean;

	private earlySignals: Set<MediaSignal>;

	// private timeoutHandler?: ReturnType<typeof setTimeout>;

	constructor(
		private readonly config: IClientMediaCallConfig,
		callId: string,
	) {
		this.emitter = new Emitter<CallEvents>();

		this.config.transporter = config.transporter;

		this.callId = callId;

		this.acceptedLocally = false;
		this.endedLocally = false;
		this.hasRemoteData = false;
		this.acknowledged = false;

		this.earlySignals = new Set();
		this._role = 'callee';
		this._state = 'none';
		this._ignored = false;
		this._contact = null;
		this._service = null;
	}

	public async initializeOutboundCall(contact: CallContact): Promise<void> {
		this._role = 'caller';
		this.acceptedLocally = true;
		this._contact = contact;
	}

	public async initializeRemoteCall(signal: MediaSignal<'new'>): Promise<void> {
		if (this.hasRemoteData) {
			return;
		}

		console.log('call.initializeRemoteCall', signal.callId);

		this.hasRemoteData = true;
		this._service = signal.body.service;
		this._role = signal.body.role;

		// If it's flagged as ignored even before the initialization, tell the server we're unavailable
		if (this.ignored) {
			return this.rejectAsUnavailable();
		}

		if (this._service === 'webrtc') {
			try {
				this.prepareWebRtcProcessor();
			} catch (e) {
				await this.rejectAsUnavailable();
				throw e;
			}
		}

		// Send an ACK so the server knows that this session exists and is reachable
		this.acknowledge();

		await this.processEarlySignals();
	}

	public getRemoteMediaStream(): MediaStream {
		if (this.shouldIgnoreWebRTC()) {
			throw new Error('getRemoteMediaStream is not available for this service');
		}

		this.prepareWebRtcProcessor();

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
		if (this.isOver()) {
			return;
		}

		console.log('ClientMediaCall.processSignal', signal.type);

		if (signal.type === 'new') {
			return this.initializeRemoteCall(signal as MediaSignal<'new'>);
		}

		if (!this.hasRemoteData) {
			this.earlySignals.add(signal);
			return;
		}

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
		this.config.transporter.answer(this.callId, 'accept');
	}

	public async reject(): Promise<void> {
		console.log('call.reject');
		if (!this.isPendingAcceptance()) {
			throw new Error('call-not-pending-acceptance');
		}
		this.config.transporter.answer(this.callId, 'reject');
		this.changeState('hangup');
	}

	public async hangup(reason: CallHangupReason = 'normal'): Promise<void> {
		console.log('call.hangup');
		if (this.endedLocally || this._state === 'hangup') {
			return;
		}

		this.endedLocally = true;
		this.flagAsEnded(reason);
	}

	public isPendingAcceptance(): boolean {
		if (this._role !== 'callee') {
			return false;
		}

		if (this.acceptedLocally) {
			return false;
		}

		return ['none', 'ringing'].includes(this._state);
	}

	public isOver(): boolean {
		return this.ignored || this._state === 'hangup';
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

	protected async processOfferRequest(signal: MediaSignal<'request-offer'>) {
		console.log('call.processOfferRequest');
		if (!signal.sessionId) {
			console.error('Received an untargeted offer request.');
			return;
		}

		if (this.shouldIgnoreWebRTC()) {
			this.config.transporter.sendError(this.callId, 'invalid-service');
			return;
		}

		this.requireWebRTC();

		let offer: MediaSignalSDP | null = null;
		try {
			offer = await this.webrtcProcessor.createOffer(signal.body);
		} catch (e) {
			this.config.transporter.sendError(this.callId, 'failed-to-create-offer');
			throw e;
		}

		if (!offer) {
			this.config.transporter.sendError(this.callId, 'implementation-error');
		}

		await this.deliverSdp(offer);
	}

	protected shouldIgnoreWebRTC(): boolean {
		// Without the remote data we don't know if the call is using webrtc or not
		return this.hasRemoteData && this._service !== 'webrtc';
	}

	protected async processAnswerRequest(signal: MediaSignal<'sdp'>): Promise<void> {
		console.log('Call.processAnswerRequest');
		if (this.shouldIgnoreWebRTC()) {
			return;
		}

		this.requireWebRTC();

		let answer: MediaSignalSDP | null = null;
		try {
			answer = await this.webrtcProcessor.createAnswer(signal.body);
		} catch (e) {
			this.config.transporter.sendError(this.callId, 'failed-to-create-answer');
			throw e;
		}

		if (!answer) {
			this.config.transporter.sendError(this.callId, 'implementation-error');
		}

		await this.deliverSdp(answer);
	}

	protected async processRemoteSDP(signal: MediaSignal<'sdp'>): Promise<void> {
		console.log('Call.processRemoteSDP');

		if (this.shouldIgnoreWebRTC()) {
			return;
		}
		this.requireWebRTC();

		if (signal.body.sdp.type === 'offer') {
			return this.processAnswerRequest(signal);
		}

		await this.webrtcProcessor.setRemoteDescription(signal.body);
	}

	protected async deliverSdp(sdp: MediaSignalSDP) {
		console.log('Call.deliverSdp');

		return this.config.transporter.sendToServer(this.callId, 'sdp', sdp);
	}

	protected async rejectAsUnavailable(): Promise<void> {
		console.log('call.rejectAsUnavailable');

		// If we have already told the server we accept this call, then we need to send a hangup to get out of it
		if (this.acceptedLocally) {
			return this.hangup('unavailable');
		}

		this.config.transporter.answer(this.callId, 'unavailable');
		this.changeState('hangup');
	}

	protected async processEarlySignals(): Promise<void> {
		console.log('call.processEarlySignals');
		const earlySignals = this.earlySignals.values().toArray();
		this.earlySignals.clear();

		for await (const signal of earlySignals) {
			try {
				await this.processSignal(signal);
			} catch (e) {
				console.error('Error processing early signal', e);
			}
		}
	}

	protected acknowledge(): void {
		console.log('call.acknowledge');
		if (this.acknowledged) {
			return;
		}

		if (this._state === 'none') {
			this._state = 'ringing';
		}

		this.acknowledged = true;
		this.config.transporter.answer(this.callId, 'ack');
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
			this.config.transporter.sendError(this.callId, 'not-accepted');
			throw new Error('Trying to activate a call that was not yet accepted locally.');
		}

		// Both sides of the call have accepted it, we can change the state now
		this.changeState('accepted');
	}

	private flagAsEnded(reasonCode: CallHangupReason): void {
		console.log('flagAsEnded');

		if (this._state === 'hangup') {
			return;
		}

		this.config.transporter.hangup(this.callId, reasonCode);

		this.changeState('hangup');
	}

	private prepareWebRtcProcessor(): asserts this is ClientMediaCallWebRTC {
		if (this.webrtcProcessor) {
			return;
		}

		console.log('session.createWebRtcProcessor');

		const {
			mediaStreamFactory,
			processorFactories: { webrtc: webrtcFactory },
		} = this.config;

		if (!webrtcFactory) {
			throw new Error('webrtc-not-implemented');
		}

		this.webrtcProcessor = webrtcFactory({ mediaStreamFactory });
	}

	private requireWebRTC(): asserts this is ClientMediaCallWebRTC {
		try {
			this.prepareWebRtcProcessor();
		} catch (e) {
			this.config.transporter.sendError(this.callId, 'webrtc-not-implemented');
			throw e;
		}
	}
}

export class ClientMediaCallWebRTC extends ClientMediaCall {
	public webrtcProcessor: IWebRTCProcessor;

	constructor(config: IClientMediaCallConfig, callId: string) {
		super(config, callId);
		throw new Error('ClientMediaCallWebRTC is not meant to be constructed.');
	}
}
