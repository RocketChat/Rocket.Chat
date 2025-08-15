import { Emitter } from '@rocket.chat/emitter';

import type { MediaSignalTransportWrapper } from './TransportWrapper';
import type { IServiceProcessorFactoryList } from '../definition';
import type {
	IClientMediaCall,
	CallEvents,
	CallContact,
	CallRole,
	CallState,
	CallService,
	CallHangupReason,
	CallActorType,
} from '../definition/call';
import type { ClientContractState, ClientState } from '../definition/client';
import type { IWebRTCProcessor, MediaStreamFactory, WebRTCInternalStateMap } from '../definition/services';
import { mergeContacts } from './utils/mergeContacts';
import type { IMediaSignalLogger } from '../definition/logger';
import type {
	ServerMediaSignal,
	ServerMediaSignalNewCall,
	ServerMediaSignalNotification,
	ServerMediaSignalRemoteSDP,
	ServerMediaSignalRequestOffer,
} from '../definition/signals/server';

export interface IClientMediaCallConfig {
	logger?: IMediaSignalLogger;
	transporter: MediaSignalTransportWrapper;
	processorFactories: IServiceProcessorFactoryList;
	mediaStreamFactory: MediaStreamFactory;
}

const TIMEOUT_TO_ACCEPT = 30000;
const TIMEOUT_TO_CONFIRM_ACCEPTANCE = 2000;
const TIMEOUT_TO_PROGRESS_SIGNALING = 10000;
const STATE_REPORT_DELAY = 300;

// if the server tells us we're the caller in a call we don't recognize, ignore it completely
const AUTO_IGNORE_UNKNOWN_OUTBOUND_CALLS = true;

type StateTimeoutHandler = {
	state: ClientState;
	handler: ReturnType<typeof setTimeout>;
};

export class ClientMediaCall implements IClientMediaCall {
	public get callId(): string {
		return this.remoteCallId ?? this.localCallId;
	}

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

	private _contact: CallContact | null;

	public get contact(): CallContact {
		return this._contact || {};
	}

	private _service: CallService | null;

	public get service(): CallService | null {
		return this._service;
	}

	public get signed(): boolean {
		return ['signed', 'pre-signed', 'self-signed'].includes(this.contractState);
	}

	public get hidden(): boolean {
		return this.ignored || this.contractState === 'ignored';
	}

	protected webrtcProcessor: IWebRTCProcessor | null = null;

	private acceptedLocally: boolean;

	private endedLocally: boolean;

	private hasRemoteData: boolean;

	private hasLocalDescription: boolean;

	private hasRemoteDescription: boolean;

	private initialized: boolean;

	private acknowledged: boolean;

	private earlySignals: Set<ServerMediaSignal>;

	private stateTimeoutHandlers: Set<StateTimeoutHandler>;

	private remoteCallId: string | null;

	private oldClientState: ClientState;

	private serviceStates: Map<string, string>;

	private stateReporterTimeoutHandler: ReturnType<typeof setTimeout> | null;

	private mayReportStates: boolean;

	private contractState: ClientContractState;

	// localCallId will only be different on calls initiated by this session
	private localCallId: string;

	constructor(
		private readonly config: IClientMediaCallConfig,
		callId: string,
	) {
		this.emitter = new Emitter<CallEvents>();

		this.config.transporter = config.transporter;

		this.localCallId = callId;
		this.remoteCallId = null;

		this.acceptedLocally = false;
		this.endedLocally = false;
		this.hasRemoteData = false;
		this.initialized = false;
		this.acknowledged = false;
		this.contractState = 'proposed';
		this.hasLocalDescription = false;
		this.hasRemoteDescription = false;
		this.serviceStates = new Map();
		this.stateReporterTimeoutHandler = null;
		this.mayReportStates = true;

		this.earlySignals = new Set();
		this.stateTimeoutHandlers = new Set();
		this._role = 'callee';
		this._state = 'none';
		this.oldClientState = 'none';
		this._ignored = false;
		this._contact = null;
		this._service = null;
	}

	// Initialize an outbound call with basic contact information until we receive the full call details from the server;
	// this gets executed once for outbound calls initiated in this session.
	public async initializeOutboundCall(contact: CallContact): Promise<void> {
		if (this.acceptedLocally) {
			return;
		}
		this.config.logger?.debug('ClientMediaCall.initializeOutboundCall');

		const wasInitialized = this.initialized;

		this.initialized = true;
		this.acceptedLocally = true;
		if (this.hasRemoteData) {
			this.changeContact(contact, { prioritizeExisting: true });
		} else {
			this._role = 'caller';
			this._contact = contact;
		}

		this.addStateTimeout('pending', TIMEOUT_TO_ACCEPT);

		if (!wasInitialized) {
			this.emitter.emit('initialized');
		}
	}

	// Initialize an outbound call with the callee information and send a call request to the server
	public async requestCall(callee: { type: CallActorType; id: string }, contactInfo?: CallContact): Promise<void> {
		if (this.initialized) {
			return;
		}

		this.config.logger?.debug('ClientMediaCall.requestCall', callee);

		this.config.transporter.sendToServer(this.callId, 'request-call', {
			callee,
			supportedServices: Object.keys(this.config.processorFactories) as CallService[],
		});

		return this.initializeOutboundCall({ ...contactInfo, ...callee });
	}

	// initialize a call with the data received from the server on a 'new' signal; this gets executed once for every call
	public async initializeRemoteCall(signal: ServerMediaSignalNewCall): Promise<void> {
		if (this.hasRemoteData) {
			return;
		}

		this.config.logger?.debug('ClientMediaCall.initializeRemoteCall', signal);

		this.remoteCallId = signal.callId;
		const wasInitialized = this.initialized;

		this.initialized = true;
		this.hasRemoteData = true;
		this._service = signal.service;
		this._role = signal.role;

		this.changeContact(signal.contact);

		if (this._role === 'caller' && !this.acceptedLocally && AUTO_IGNORE_UNKNOWN_OUTBOUND_CALLS) {
			this.config.logger?.log('Ignoring Unknown Outbound Call');
			this.ignore();
		}

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

		if (this._role === 'callee' || !this.acceptedLocally) {
			this.addStateTimeout('pending', TIMEOUT_TO_ACCEPT);
		}

		// If the call was requested by this specific session, assume we're signed already.
		if (this._role === 'caller' && this.acceptedLocally && signal.requestedCallId === this.localCallId) {
			this.contractState = 'pre-signed';
		}

		if (!wasInitialized) {
			this.emitter.emit('initialized');
		}

		await this.processEarlySignals();
	}

	public getClientState(): ClientState {
		if (this.isOver()) {
			return 'hangup';
		}

		if (this.hidden) {
			return 'busy-elsewhere';
		}

		switch (this._state) {
			case 'none':
			case 'ringing':
				if (this.hasRemoteData && this._role === 'callee' && this.acceptedLocally) {
					return 'accepting';
				}
				return 'pending';
			case 'accepted':
				if (this.hasLocalDescription && this.hasRemoteDescription) {
					return 'has-answer';
				}
				if (this.hasLocalDescription !== this.hasRemoteDescription) {
					return 'has-offer';
				}

				return 'accepted';
			default:
				return this._state;
		}
	}

	public getRemoteMediaStream(): MediaStream {
		this.config.logger?.debug('ClientMediaCall.getRemoteMediaStream');
		if (this.shouldIgnoreWebRTC()) {
			this.throwError('getRemoteMediaStream is not available for this service');
		}

		this.prepareWebRtcProcessor();

		return this.webrtcProcessor.getRemoteMediaStream();
	}

	public async processSignal(signal: ServerMediaSignal) {
		if (this.isOver()) {
			return;
		}
		this.config.logger?.debug('ClientMediaCall.processSignal', signal);

		const { type: signalType } = signal;

		if (signalType === 'new') {
			return this.initializeRemoteCall(signal);
		}

		if (!this.hasRemoteData) {
			this.config.logger?.debug('Remote data missing, adding signal to queue');
			this.earlySignals.add(signal);
			return;
		}

		switch (signalType) {
			case 'remote-sdp':
				return this.processRemoteSDP(signal);
			case 'request-offer':
				return this.processOfferRequest(signal);
			case 'notification':
				return this.processNotification(signal);
		}
	}

	public accept(): void {
		this.config.logger?.debug('ClientMediaCall.accept');

		if (!this.isPendingOurAcceptance()) {
			this.throwError('call-not-pending-acceptance');
		}

		if (!this.hasRemoteData) {
			this.throwError('missing-remote-data');
		}

		this.acceptedLocally = true;
		this.config.transporter.answer(this.callId, 'accept');

		if (this.getClientState() === 'accepting') {
			this.updateStateTimeouts();
			this.addStateTimeout('accepting', TIMEOUT_TO_CONFIRM_ACCEPTANCE);

			this.emitter.emit('accepting');
		}
	}

	public reject(): void {
		this.config.logger?.debug('ClientMediaCall.reject');

		if (!this.isPendingOurAcceptance()) {
			this.throwError('call-not-pending-acceptance');
		}

		if (!this.hasRemoteData) {
			this.throwError('missing-remote-data');
		}

		this.config.transporter.answer(this.callId, 'reject');
		this.changeState('hangup');
	}

	public hangup(reason: CallHangupReason = 'normal'): void {
		this.config.logger?.debug('ClientMediaCall.hangup', reason);
		if (this.endedLocally || this._state === 'hangup') {
			return;
		}

		if (this.hidden) {
			return;
		}

		this.endedLocally = true;
		this.flagAsEnded(reason);
	}

	public isPendingAcceptance(): boolean {
		return ['none', 'ringing'].includes(this._state);
	}

	public isPendingOurAcceptance(): boolean {
		if (this._role !== 'callee' || this.acceptedLocally) {
			return false;
		}

		if (this.hidden) {
			return false;
		}

		return this.isPendingAcceptance();
	}

	public isOver(): boolean {
		return this._state === 'hangup';
	}

	public ignore(): void {
		if (this.ignored) {
			return;
		}

		const { hidden: wasHidden } = this;

		this.config.logger?.debug('ClientMediaCall.ignore');

		this._ignored = true;
		if (this.hidden && !wasHidden) {
			this.emitter.emit('hidden');
		}

		this.updateClientState();
		this.reportStates();
		this.mayReportStates = false;
	}

	public setContractState(state: 'signed' | 'ignored') {
		if (this.contractState === state) {
			return;
		}
		this.config.logger?.debug('ClientMediaCall.setContractState', `${this.contractState} => ${state}`);

		if (['pre-signed', 'self-signed'].includes(this.contractState) && state === 'signed') {
			this.contractState = state;
			return;
		}

		if (this.contractState !== 'proposed') {
			this.reportStates();
		}

		if (this.contractState === 'signed') {
			if (state === 'ignored') {
				this.config.logger?.error('[Media Signal] Trying to ignore a contract that was already signed.');
			}
			return;
		}

		if (this.contractState === 'pre-signed' && state === 'ignored') {
			this.config.logger?.error('[Media Signal] Our self signed contract was ignored.');
		}

		const { hidden: wasHidden } = this;
		this.contractState = state;
		if (this.hidden && !wasHidden) {
			this.emitter.emit('hidden');
		}
	}

	public reportStates(): void {
		this.config.logger?.debug('ClientMediaCall.reportStates');
		this.clearStateReporter();
		if (!this.mayReportStates) {
			return;
		}

		this.config.transporter.sendToServer(this.callId, 'local-state', {
			callState: this.state,
			clientState: this.getClientState(),
			serviceStates: Object.fromEntries(this.serviceStates.entries()),
			ignored: this.ignored,
			contractState: this.contractState,
		});

		if (this.state === 'hangup') {
			this.mayReportStates = false;
		}
	}

	private changeState(newState: CallState): void {
		if (newState === this._state) {
			return;
		}

		this.config.logger?.debug('ClientMediaCall.changeState', `${this._state} => ${newState}`);

		const oldState = this._state;
		this._state = newState;
		this.updateClientState();

		this.emitter.emit('stateChange', oldState);
		this.requestStateReport();

		switch (newState) {
			case 'accepted':
				this.emitter.emit('accepted');
				break;
			case 'active':
				this.emitter.emit('active');
				this.reportStates();
				break;

			case 'hangup':
				this.emitter.emit('ended');
				break;
		}
	}

	private updateClientState(): void {
		const { oldClientState } = this;

		const clientState = this.getClientState();
		if (clientState === oldClientState) {
			return;
		}

		this.config.logger?.debug('ClientMediaCall.updateClientState', `${oldClientState} => ${clientState}`);

		this.updateStateTimeouts();
		this.requestStateReport();
		this.oldClientState = clientState;
		this.emitter.emit('clientStateChange', oldClientState);
	}

	private changeContact(contact: CallContact | null, { prioritizeExisting }: { prioritizeExisting?: boolean } = {}): void {
		this.config.logger?.debug('ClientMediaCall.changeContact');
		const oldContct = prioritizeExisting ? contact : this._contact;
		const newContact = prioritizeExisting ? this._contact : contact;

		this._contact = mergeContacts(oldContct, newContact);
		if (this._contact) {
			this.emitter.emit('contactUpdate');
		}
	}

	protected async processOfferRequest(signal: ServerMediaSignalRequestOffer) {
		this.config.logger?.debug('ClientMediaCall.processOfferRequest', signal);

		if (!signal.toContractId && !this.signed) {
			this.config.logger?.error('Received an unsigned offer request.');
			return;
		}

		if (this.shouldIgnoreWebRTC()) {
			this.sendError('invalid-service');
			return;
		}

		this.requireWebRTC();

		let offer: { sdp: RTCSessionDescriptionInit } | null = null;
		try {
			offer = await this.webrtcProcessor.createOffer(signal);
		} catch (e) {
			this.sendError('failed-to-create-offer');
			throw e;
		}

		if (!offer) {
			this.sendError('implementation-error');
		}

		await this.deliverSdp(offer);
	}

	protected shouldIgnoreWebRTC(): boolean {
		if (this.hasRemoteData) {
			return this.service !== 'webrtc';
		}

		// If we called and we don't support webrtc, assume it's not gonna be a webrtc call
		if (this._role === 'caller' && !this.config.processorFactories.webrtc) {
			return true;
		}

		// With no more info, we can't safely ignore webrtc
		return false;
	}

	protected async processAnswerRequest(signal: ServerMediaSignalRemoteSDP): Promise<void> {
		if (this.shouldIgnoreWebRTC()) {
			return;
		}

		this.config.logger?.debug('ClientMediaCall.processAnswerRequest', signal);

		this.requireWebRTC();

		let answer: { sdp: RTCSessionDescriptionInit } | null = null;
		try {
			answer = await this.webrtcProcessor.createAnswer(signal);
		} catch (e) {
			this.sendError('failed-to-create-answer');
			throw e;
		}

		if (!answer) {
			this.sendError('implementation-error');
			return;
		}

		this.hasRemoteDescription = true;
		await this.deliverSdp(answer);
	}

	protected sendError(errorCode: string): void {
		this.config.logger?.debug('ClientMediaCall.sendError', errorCode);

		if (this.hidden) {
			return;
		}

		this.config.transporter.sendError(this.callId, errorCode);
	}

	protected async processRemoteSDP(signal: ServerMediaSignalRemoteSDP): Promise<void> {
		this.config.logger?.debug('ClientMediaCall.processRemoteSDP', signal);
		if (this.hidden) {
			return;
		}

		if (!signal.toContractId && !this.signed) {
			this.config.logger?.error('Received an unsigned SDP signal');
			return;
		}

		if (this.shouldIgnoreWebRTC()) {
			return;
		}
		this.requireWebRTC();

		if (signal.sdp.type === 'offer') {
			return this.processAnswerRequest(signal);
		}

		await this.webrtcProcessor.setRemoteDescription(signal);
		this.hasRemoteDescription = true;
	}

	protected async deliverSdp(data: { sdp: RTCSessionDescriptionInit }) {
		this.config.logger?.debug('ClientMediaCall.deliverSdp');
		this.hasLocalDescription = true;

		if (!this.hidden) {
			this.config.transporter.sendToServer(this.callId, 'local-sdp', data);
		}

		this.updateClientState();
	}

	protected async rejectAsUnavailable(): Promise<void> {
		this.config.logger?.debug('ClientMediaCall.rejectAsUnavailable');

		// If we have already told the server we accept this call, then we need to send a hangup to get out of it
		if (this.acceptedLocally) {
			return this.hangup('unavailable');
		}

		this.config.transporter.answer(this.callId, 'unavailable');
		this.changeState('hangup');
	}

	protected async processEarlySignals(): Promise<void> {
		this.config.logger?.debug('ClientMediaCall.processEarlySignals');

		const earlySignals = this.earlySignals.values().toArray();
		this.earlySignals.clear();

		for await (const signal of earlySignals) {
			try {
				await this.processSignal(signal);
			} catch (e) {
				this.config.logger?.error('Error processing early signal', e);
			}
		}
	}

	protected acknowledge(): void {
		if (this.acknowledged || this.hidden) {
			return;
		}

		this.config.logger?.debug('ClientMediaCall.acknowledge');

		this.acknowledged = true;
		this.config.transporter.answer(this.callId, 'ack');

		if (this._state === 'none') {
			this.changeState('ringing');
		}
	}

	private async processNotification(signal: ServerMediaSignalNotification) {
		this.config.logger?.debug('ClientMediaCall.processNotification');

		switch (signal.notification) {
			case 'accepted':
				return this.flagAsAccepted();
			case 'active':
				if (this.state === 'accepted') {
					this.changeState('active');
				}
				return;

			case 'hangup':
				return this.flagAsEnded('remote');
		}
	}

	private async flagAsAccepted(): Promise<void> {
		this.config.logger?.debug('ClientMediaCall.flagAsAccepted');

		// If hidden, just move the state without doing anything
		if (this.hidden) {
			this.changeState('accepted');
			return;
		}

		if (!this.acceptedLocally) {
			this.config.transporter.sendError(this.callId, 'not-accepted');
			this.config.logger?.error('Trying to activate a call that was not yet accepted locally.');
			return;
		}

		if (this.contractState === 'proposed') {
			this.contractState = 'self-signed';
		}

		// Both sides of the call have accepted it, we can change the state now
		this.changeState('accepted');

		this.addStateTimeout('accepted', TIMEOUT_TO_PROGRESS_SIGNALING);
		this.addStateTimeout('has-offer', TIMEOUT_TO_PROGRESS_SIGNALING);
	}

	private flagAsEnded(reason: CallHangupReason): void {
		this.config.logger?.debug('ClientMediaCall.flagAsEnded', reason);
		if (this._state === 'hangup') {
			return;
		}

		if (!this.hidden) {
			this.config.transporter.hangup(this.callId, reason);
		}

		this.changeState('hangup');
	}

	private addStateTimeout(state: ClientState, timeout: number, callback?: () => void): void {
		this.config.logger?.debug('ClientMediaCall.addStateTimeout', state, `${timeout / 1000}s`);
		if (this.getClientState() !== state) {
			return;
		}
		// Do not set state timeouts if the call is not happening on this session, unless there's a callback attached to that timeout
		if (this.hidden && !callback) {
			return;
		}

		const handler = {
			state,
			handler: setTimeout(() => {
				if (this.stateTimeoutHandlers.has(handler)) {
					this.stateTimeoutHandlers.delete(handler);
				}

				if (state !== this.getClientState()) {
					return;
				}

				if (callback) {
					callback();
				} else {
					void this.hangup('timeout');
				}
			}, timeout),
		};

		this.stateTimeoutHandlers.add(handler);
	}

	private updateStateTimeouts(): void {
		this.config.logger?.debug('ClientMediaCall.updateStateTimeouts');
		const clientState = this.getClientState();

		for (const handler of this.stateTimeoutHandlers.values()) {
			if (handler.state === clientState) {
				continue;
			}

			clearTimeout(handler.handler);
			this.stateTimeoutHandlers.delete(handler);
		}
	}

	private onWebRTCInternalStateChange(stateName: keyof WebRTCInternalStateMap): void {
		this.config.logger?.debug('ClientMediaCall.onWebRTCInternalStateChange');
		if (!this.webrtcProcessor) {
			return;
		}
		const stateValue = this.webrtcProcessor.getInternalState(stateName);

		if (this.serviceStates.get(stateName) !== stateValue) {
			this.serviceStates.set(stateName, stateValue);

			switch (stateName) {
				case 'connection':
					this.onWebRTCConnectionStateChange(stateValue as RTCPeerConnectionState);
					break;
			}

			this.requestStateReport();
		}
	}

	private onWebRTCConnectionStateChange(stateValue: RTCPeerConnectionState): void {
		if (this.hidden) {
			return;
		}

		try {
			switch (stateValue) {
				case 'connected':
					if (this.state === 'accepted') {
						this.changeState('active');
					}
					break;
				case 'failed':
					if (!this.isOver()) {
						this.hangup('service-error');
					}
					break;
				case 'closed':
					if (!this.isOver()) {
						this.hangup('service-error');
					}
					break;
				case 'disconnected':
					if (this.state === 'active') {
						this.hangup('service-error');
					}
					break;
			}
		} catch (e) {
			this.config.logger?.error('An error occured while reviewing the webrtc connection state change', e);
		}
	}

	private clearStateReporter(): void {
		this.config.logger?.debug('ClientMediaCall.clearStateReporter');
		if (this.stateReporterTimeoutHandler) {
			clearTimeout(this.stateReporterTimeoutHandler);
			this.stateReporterTimeoutHandler = null;
		}
	}

	private requestStateReport(): void {
		this.config.logger?.debug('ClientMediaCall.requestStateReport');
		this.clearStateReporter();
		if (!this.mayReportStates) {
			return;
		}

		this.stateReporterTimeoutHandler = setTimeout(() => {
			this.reportStates();
		}, STATE_REPORT_DELAY);
	}

	private throwError(error: string): never {
		this.config.logger?.error(error);
		throw new Error(error);
	}

	private prepareWebRtcProcessor(): asserts this is ClientMediaCallWebRTC {
		this.config.logger?.debug('ClientMediaCall.prepareWebRtcProcessor');
		if (this.webrtcProcessor) {
			return;
		}

		const {
			mediaStreamFactory,
			logger,
			processorFactories: { webrtc: webrtcFactory },
		} = this.config;

		if (!webrtcFactory) {
			this.throwError('webrtc-not-implemented');
		}

		this.webrtcProcessor = webrtcFactory({ mediaStreamFactory, logger });
		this.webrtcProcessor.emitter.on('internalStateChange', (stateName) => this.onWebRTCInternalStateChange(stateName));
	}

	private requireWebRTC(): asserts this is ClientMediaCallWebRTC {
		try {
			this.prepareWebRtcProcessor();
		} catch (e) {
			this.sendError('webrtc-not-implemented');
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
