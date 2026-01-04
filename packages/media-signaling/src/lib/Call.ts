import { Emitter } from '@rocket.chat/emitter';

import type { MediaSignalTransportWrapper } from './TransportWrapper';
import type { ClientMediaSignalError, IServiceProcessorFactoryList } from '../definition';
import { NegotiationManager } from './NegotiationManager';
import type {
	IClientMediaCall,
	CallEvents,
	CallContact,
	CallRole,
	CallState,
	CallService,
	CallHangupReason,
	CallActorType,
	CallFlag,
} from '../definition/call';
import type { ClientContractState, ClientState } from '../definition/client';
import type { IMediaSignalLogger } from '../definition/logger';
import type { IWebRTCProcessor, WebRTCInternalStateMap } from '../definition/services';
import { isPendingState } from './services/states';
import { serializeError } from './utils/serializeError';
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
	sessionId: string;

	iceGatheringTimeout: number;
	iceServers: RTCIceServer[];
}

const TIMEOUT_TO_ACCEPT = 30000;
const TIMEOUT_TO_CONFIRM_ACCEPTANCE = 2000;
const TIMEOUT_TO_PROGRESS_SIGNALING = 10000;
const STATE_REPORT_DELAY = 300;
const CALLS_WITH_NO_REMOTE_DATA_REPORT_DELAY = 5000;

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

	private _transferredBy: CallContact | null;

	public get transferredBy(): CallContact | null {
		return this._transferredBy;
	}

	private _service: CallService | null;

	public get service(): CallService | null {
		return this._service;
	}

	public get signed(): boolean {
		return ['signed', 'pre-signed', 'self-signed'].includes(this.contractState);
	}

	public get hidden(): boolean {
		/**
		 * A call is hidden if:
		 * 1. It was flagged as ignored by the Session
		 * 2. It is happening in a different session
		 * 3. The call was started in some other session and we have not received its data yet
		 *    Since the Call instance is only created when we receive "something" from the server, this would mean we received signals out of order, or missed one.
		 */

		return this.ignored || this.contractState === 'ignored' || !this.initialized;
	}

	public get muted(): boolean {
		if (!this.webrtcProcessor) {
			return false;
		}

		return this.webrtcProcessor.muted;
	}

	/** indicates if the call is on hold */
	public get held(): boolean {
		if (!this.webrtcProcessor) {
			return false;
		}

		return this.webrtcProcessor.held;
	}

	private _remoteHeld: boolean;

	public get remoteHeld(): boolean {
		return this._remoteHeld;
	}

	private _remoteMute: boolean;

	public get remoteMute(): boolean {
		return this._remoteMute;
	}

	/** indicates the call is past the "dialing" stage and not yet over */
	public get busy(): boolean {
		return !this.isPendingAcceptance() && !this.isOver();
	}

	public get confirmed(): boolean {
		return this.hasRemoteData;
	}

	public get tempCallId(): string {
		return this.localCallId;
	}

	protected webrtcProcessor: IWebRTCProcessor | null = null;

	private acceptedLocally: boolean;

	private endedLocally: boolean;

	private hasRemoteData: boolean;

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

	private inputTrack: MediaStreamTrack | null;

	/** localCallId will only be different on calls initiated by this session */
	private localCallId: string;

	private creationTimestamp: Date;

	private negotiationManager: NegotiationManager;

	public get audioLevel(): number {
		return this.webrtcProcessor?.audioLevel || 0;
	}

	public get localAudioLevel(): number {
		return this.webrtcProcessor?.localAudioLevel || 0;
	}

	private _flags: CallFlag[];

	public get flags(): CallFlag[] {
		return this._flags;
	}

	constructor(
		private readonly config: IClientMediaCallConfig,
		callId: string,
		{ inputTrack }: { inputTrack?: MediaStreamTrack | null } = {},
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
		this.serviceStates = new Map();
		this.stateReporterTimeoutHandler = null;
		this.mayReportStates = true;
		this.inputTrack = inputTrack || null;
		this.creationTimestamp = new Date();

		this.earlySignals = new Set();
		this.stateTimeoutHandlers = new Set();
		this._role = 'callee';
		this._state = 'none';
		this.oldClientState = 'none';
		this._ignored = false;
		this._contact = null;
		this._transferredBy = null;
		this._service = null;
		this._remoteHeld = false;
		this._remoteMute = false;
		this._flags = [];

		this.negotiationManager = new NegotiationManager(this, { logger: config.logger });
	}

	/**
	 * Initialize an outbound call with basic contact information until we receive the full call details from the server;
	 * this gets executed once for outbound calls initiated in this session.
	 */
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

	/** Initialize an outbound call with the callee information and send a call request to the server */
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

	/** initialize a call with the data received from the server on a 'new' signal; this gets executed once for every call */
	public async initializeRemoteCall(signal: ServerMediaSignalNewCall, oldCall?: ClientMediaCall | null): Promise<void> {
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
		this._flags = signal.flags || [];

		this._transferredBy = signal.transferredBy || null;

		if (this._role === 'caller' && !this.acceptedLocally) {
			if (oldCall) {
				this.acceptedLocally = true;
			} else if (signal.self?.contractId && signal.self.contractId !== this.config.sessionId) {
				// Call from another session, must be flagged as ignored before any event is triggered
				this.config.logger?.log('Ignoring Outbound Call from a different session');
				this.contractState = 'ignored';
			} else if (AUTO_IGNORE_UNKNOWN_OUTBOUND_CALLS) {
				this.config.logger?.log('Ignoring Unknown Outbound Call');
				this.ignore();
			}
		}

		this.changeContact(signal.contact);

		// If the call is already flagged as over before the initialization, do not process anything other than filling in the basic information
		if (this.isOver()) {
			return;
		}

		// If it's flagged as ignored even before the initialization, tell the server we're unavailable
		if (this.ignored) {
			return this.rejectAsUnavailable();
		}

		if (this._service === 'webrtc') {
			try {
				this.prepareWebRtcProcessor();
			} catch (e) {
				this.sendError({
					errorType: 'service',
					errorCode: 'service-initialization-failed',
					critical: true,
					errorDetails: serializeError(e),
				});
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
		if (
			this._role === 'caller' &&
			this.acceptedLocally &&
			this.contractState !== 'ignored' &&
			(signal.requestedCallId === this.localCallId || Boolean(oldCall))
		) {
			this.contractState = 'pre-signed';
		}

		if (!wasInitialized) {
			this.emitter.emit('initialized');
		}
		this.emitter.emit('confirmed');

		await this.processEarlySignals();
	}

	public mayNeedInputTrack(): boolean {
		if (this.isOver() || this._ignored || this.hidden) {
			return false;
		}

		return true;
	}

	public needsInputTrack(): boolean {
		if (!this.mayNeedInputTrack()) {
			return false;
		}

		if (this.role === 'caller') {
			return this.hasRemoteData;
		}

		return this.busy;
	}

	public hasInputTrack(): boolean {
		return Boolean(this.inputTrack);
	}

	public isMissingInputTrack(): boolean {
		return !this.hasInputTrack() && this.mayNeedInputTrack();
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
			default:
				return this._state;
		}
	}

	public async setInputTrack(newInputTrack: MediaStreamTrack | null): Promise<void> {
		this.config.logger?.debug('ClientMediaCall.setInputTrack', Boolean(newInputTrack));
		if (newInputTrack && (this.isOver() || this.hidden)) {
			return;
		}

		const hadInputTrack = Boolean(this.inputTrack);

		this.inputTrack = newInputTrack;
		if (this.webrtcProcessor) {
			await this.webrtcProcessor.setInputTrack(newInputTrack);
		}

		if (newInputTrack && !hadInputTrack) {
			await this.negotiationManager.processNegotiations();
		}
	}

	public getRemoteMediaStream(): MediaStream | null {
		this.config.logger?.debug('ClientMediaCall.getRemoteMediaStream');
		if (this.hidden || !this.signed) {
			return null;
		}

		if (this.shouldIgnoreWebRTC()) {
			return null;
		}

		this.prepareWebRtcProcessor();

		return this.webrtcProcessor.getRemoteMediaStream();
	}

	public async processSignal(signal: ServerMediaSignal, oldCall?: ClientMediaCall | null) {
		if (this.isOver()) {
			return;
		}
		this.config.logger?.debug('ClientMediaCall.processSignal', signal);

		const { type: signalType } = signal;

		if (signalType === 'new') {
			return this.initializeRemoteCall(signal, oldCall);
		}

		if (signalType === 'rejected-call-request') {
			return this.flagAsEnded('remote');
		}

		if (!this.hasRemoteData) {
			// if the call is over, we no longer need to wait for its data
			if (signal.type === 'notification' && signal.notification === 'hangup') {
				this.changeState('hangup');
				return;
			}

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

	public transfer(callee: { type: CallActorType; id: string }): void {
		if (!this.busy) {
			return;
		}

		this.config.logger?.debug('ClientMediaCall.transfer', callee);

		this.config.transporter.sendToServer(this.callId, 'transfer', {
			to: callee,
		});
	}

	public hangup(reason: CallHangupReason = 'normal'): void {
		this.config.logger?.debug('ClientMediaCall.hangup', reason);
		if (this.endedLocally || this._state === 'hangup') {
			return;
		}

		// If the hangup was requested by the user but the call is not happening here, send an 'another-client' hangup request to the server and wait for the server to hangup the call
		if (reason === 'normal' && this.contractState === 'ignored') {
			this.config.transporter.hangup(this.callId, 'another-client');
			return;
		}

		if (this.hidden) {
			return;
		}

		this.endedLocally = true;
		this.flagAsEnded(reason);
	}

	public isPendingAcceptance(): boolean {
		return isPendingState(this._state);
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

	public isAbleToReportStates(): boolean {
		return this.mayReportStates;
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
		this.clearStateTimeouts();
	}

	public setMuted(muted: boolean): void {
		if (this.isOver() || this.hidden) {
			return;
		}
		if (!this.webrtcProcessor && !muted) {
			return;
		}

		this.requireWebRTC();
		const wasMuted = this.webrtcProcessor.muted;
		this.webrtcProcessor.setMuted(muted);
		if (wasMuted !== this.webrtcProcessor.muted) {
			this.emitter.emit('trackStateChange');
		}
	}

	public setHeld(held: boolean): void {
		if (this.isOver() || this.hidden) {
			return;
		}
		if (!this.webrtcProcessor && !held) {
			return;
		}

		this.requireWebRTC();
		const wasOnHold = this.webrtcProcessor.held;
		this.webrtcProcessor.setHeld(held);
		if (wasOnHold !== this.webrtcProcessor.held) {
			this.emitter.emit('trackStateChange');
		}
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
		this.maybeStopWebRTC();
	}

	public reportStates(): void {
		this.config.logger?.debug('ClientMediaCall.reportStates');
		this.clearStateReporter();
		if (!this.mayReportStates) {
			return;
		}

		if (this.hasRemoteData || Date.now() > this.creationTimestamp.valueOf() + CALLS_WITH_NO_REMOTE_DATA_REPORT_DELAY) {
			this.config.transporter.sendToServer(this.callId, 'local-state', {
				callState: this.state,
				clientState: this.getClientState(),
				serviceStates: Object.fromEntries(this.serviceStates.entries()),
				ignored: this.ignored,
				contractState: this.contractState,
				...(this.negotiationManager.currentNegotiationId && { negotiationId: this.negotiationManager.currentNegotiationId }),
			});
		}

		if (this.state === 'hangup') {
			this.mayReportStates = false;
		}
	}

	public sendDTMF(dtmf: string, duration?: number): void {
		if (!dtmf || !/^[0-9A-D#*,]$/.exec(dtmf)) {
			throw new Error('Invalid DTMF tone.');
		}

		this.config.transporter.sendToServer(this.callId, 'dtmf', {
			dtmf,
			duration,
		});
	}

	public async getStats(selector?: MediaStreamTrack | null): Promise<RTCStatsReport | null> {
		return this.webrtcProcessor?.getStats(selector) ?? null;
	}

	private changeState(newState: CallState): void {
		if (newState === this._state) {
			return;
		}

		this.config.logger?.debug('ClientMediaCall.changeState', `${this._state} => ${newState}`);

		const oldState = this._state;
		this._state = newState;
		this.maybeStopWebRTC();
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

	private maybeStopWebRTC(): void {
		if (!this.webrtcProcessor) {
			return;
		}

		if (this.isOver() || this.hidden) {
			this.webrtcProcessor.stop();
		}
	}

	private changeContact(contact: CallContact | null, { prioritizeExisting }: { prioritizeExisting?: boolean } = {}): void {
		this.config.logger?.debug('ClientMediaCall.changeContact');
		const lowPriorityContact = prioritizeExisting ? contact : this._contact;
		const highPriorityContact = prioritizeExisting ? this._contact : contact;

		const finalContact = highPriorityContact || lowPriorityContact;

		this._contact = finalContact && { ...finalContact };
		if (this._contact) {
			this.emitter.emit('contactUpdate');
		}
	}

	protected async processOfferRequest(signal: ServerMediaSignalRequestOffer) {
		if (this.hidden || this.isOver()) {
			return;
		}

		this.config.logger?.debug('ClientMediaCall.processOfferRequest', signal);

		if (!this.isSignalTargetingThisSession(signal)) {
			this.config.logger?.error('Received an unsigned offer request.');
			return;
		}

		const { negotiationId } = signal;

		if (this.shouldIgnoreWebRTC()) {
			this.sendError({ errorType: 'service', errorCode: 'invalid-service', negotiationId, critical: true });
			return;
		}

		this.requireWebRTC();
		this.negotiationManager.addNegotiation(negotiationId);
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
		if (this.hidden || this.shouldIgnoreWebRTC()) {
			return;
		}

		this.config.logger?.debug('ClientMediaCall.processAnswerRequest', signal);

		this.requireWebRTC();

		this.negotiationManager.addNegotiation(signal.negotiationId, signal.sdp);
	}

	protected sendError(error: Partial<ClientMediaSignalError>): void {
		this.config.logger?.debug('ClientMediaCall.sendError', error);

		if (this.hidden) {
			return;
		}

		this.config.transporter.sendError(this.callId, error);
	}

	protected async processRemoteSDP(signal: ServerMediaSignalRemoteSDP): Promise<void> {
		this.config.logger?.debug('ClientMediaCall.processRemoteSDP', signal);
		if (this.hidden) {
			return;
		}

		if (!this.isSignalTargetingThisSession(signal)) {
			this.config.logger?.error('Received an offer request that is unsigned, or signed to a different session.');
			return;
		}

		if (this.shouldIgnoreWebRTC()) {
			return;
		}

		this.requireWebRTC();

		if (signal.sdp.type === 'offer') {
			return this.processAnswerRequest(signal);
		}

		if (signal.sdp.type !== 'answer') {
			this.config.logger?.error('Unsupported sdp type.');
			return;
		}

		await this.negotiationManager.setRemoteDescription(signal.negotiationId, signal.sdp);
	}

	protected deliverSdp(data: { sdp: RTCSessionDescriptionInit; negotiationId: string }) {
		this.config.logger?.debug('ClientMediaCall.deliverSdp');

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

		const earlySignals = Array.from(this.earlySignals.values());
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
				if (this.state === 'accepted' || this.hidden) {
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
			this.config.transporter.sendError(this.callId, { errorType: 'signaling', errorCode: 'not-accepted', critical: true });
			this.config.logger?.error('Trying to activate a call that was not yet accepted locally.');
			return;
		}

		if (this.contractState === 'proposed') {
			this.contractState = 'self-signed';
		}

		// Both sides of the call have accepted it, we can change the state now
		this.changeState('accepted');

		this.addStateTimeout('accepted', TIMEOUT_TO_PROGRESS_SIGNALING);
	}

	private flagAsEnded(reason: CallHangupReason): void {
		this.config.logger?.debug('ClientMediaCall.flagAsEnded', reason);
		if (this._state === 'hangup') {
			return;
		}

		if (!this.hidden && this.hasRemoteData) {
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

	private clearStateTimeouts(): void {
		for (const handler of this.stateTimeoutHandlers.values()) {
			clearTimeout(handler.handler);
		}
		this.stateTimeoutHandlers.clear();
	}

	private updateRemoteStates(): void {
		if (!this.webrtcProcessor) {
			return;
		}

		const isRemoteHeld = this.webrtcProcessor.isRemoteHeld();
		const isRemoteMute = this.webrtcProcessor.isRemoteMute();

		if (isRemoteHeld === this._remoteHeld && isRemoteMute === this._remoteMute) {
			return;
		}

		this._remoteHeld = isRemoteHeld;
		this._remoteMute = isRemoteMute;
		this.emitter.emit('trackStateChange');
	}

	private onWebRTCInternalStateChange(stateName: keyof WebRTCInternalStateMap): void {
		this.config.logger?.debug('ClientMediaCall.onWebRTCInternalStateChange');
		if (!this.webrtcProcessor) {
			return;
		}
		const stateValue = this.webrtcProcessor.getInternalState(stateName);

		if (typeof stateValue === 'string' && this.serviceStates.get(stateName) !== stateValue) {
			this.config.logger?.debug(stateName, stateValue);
			this.serviceStates.set(stateName, stateValue);

			switch (stateName) {
				case 'connection':
					this.onWebRTCConnectionStateChange(stateValue as RTCPeerConnectionState);
					break;
			}

			this.requestStateReport();
		}

		this.updateRemoteStates();
	}

	private onNegotiationNeeded(oldNegotiationId: string): void {
		this.config.logger?.debug('ClientMediaCall.onNegotiationNeeded', oldNegotiationId);

		this.config.transporter.requestRenegotiation(this.callId, oldNegotiationId);
	}

	private onNegotiationError(negotiationId: string, errorCode: string): void {
		this.config.logger?.debug('ClientMediaCall.onNegotiationError', negotiationId, errorCode);
		this.sendError({
			errorType: 'service',
			errorCode,
			negotiationId,
			critical: false,
		});
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
						this.sendError({
							errorType: 'service',
							errorCode: 'connection-failed',
							critical: true,
							negotiationId: this.negotiationManager.currentNegotiationId || undefined,
						});

						this.hangup('service-error');
					}
					break;
				case 'closed':
					if (!this.isOver()) {
						this.sendError({
							errorType: 'service',
							errorCode: 'connection-closed',
							critical: true,
							negotiationId: this.negotiationManager.currentNegotiationId || undefined,
						});

						this.hangup('service-error');
					}
					break;
				case 'disconnected':
					// Disconnected state is temporary, so let's wait for it to change into something else before reacting.
					break;
			}
		} catch (e) {
			this.config.logger?.error('An error occured while reviewing the webrtc connection state change', e);
		}
	}

	private clearStateReporter(): void {
		if (this.stateReporterTimeoutHandler) {
			clearTimeout(this.stateReporterTimeoutHandler);
			this.stateReporterTimeoutHandler = null;
		}
	}

	private requestStateReport(): void {
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

	private isSignalTargetingThisSession(signal: ServerMediaSignalRemoteSDP | ServerMediaSignalRequestOffer): boolean {
		if (signal.toContractId) {
			return signal.toContractId === this.config.sessionId;
		}

		return this.signed;
	}

	private prepareWebRtcProcessor(): asserts this is ClientMediaCallWebRTC {
		this.config.logger?.debug('ClientMediaCall.prepareWebRtcProcessor');
		if (this.webrtcProcessor) {
			return;
		}

		const {
			logger,
			processorFactories: { webrtc: webrtcFactory },
			iceGatheringTimeout,
		} = this.config;

		if (!webrtcFactory) {
			this.throwError('webrtc-not-implemented');
		}

		this.webrtcProcessor = webrtcFactory({
			logger,
			iceGatheringTimeout,
			call: this,
			inputTrack: this.inputTrack,
			...(this.config.iceServers.length && { rtc: { iceServers: this.config.iceServers } }),
		});
		this.webrtcProcessor.emitter.on('internalStateChange', (stateName) => this.onWebRTCInternalStateChange(stateName));

		this.negotiationManager.emitter.on('local-sdp', ({ sdp, negotiationId }) => this.deliverSdp({ sdp, negotiationId }));
		this.negotiationManager.emitter.on('negotiation-needed', ({ oldNegotiationId }) => this.onNegotiationNeeded(oldNegotiationId));
		this.negotiationManager.emitter.on('error', ({ errorCode, negotiationId }) => this.onNegotiationError(negotiationId, errorCode));
		this.negotiationManager.setWebRTCProcessor(this.webrtcProcessor);
	}

	private requireWebRTC(): asserts this is ClientMediaCallWebRTC {
		try {
			this.prepareWebRtcProcessor();
		} catch (e) {
			this.sendError({ errorType: 'service', errorCode: 'webrtc-not-implemented', critical: true, errorDetails: serializeError(e) });
			throw e;
		}
	}
}

export abstract class ClientMediaCallWebRTC extends ClientMediaCall {
	public abstract override webrtcProcessor: IWebRTCProcessor;
}
