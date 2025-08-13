import { Emitter } from '@rocket.chat/emitter';

import { ClientMediaCall } from './Call';
import { MediaSignalTransportWrapper } from './TransportWrapper';
import type {
	ClientMediaSignal,
	ClientState,
	IServiceProcessorFactoryList,
	MediaSignalTransport,
	MediaStreamFactory,
	ServerMediaSignal,
} from '../definition';
import type { IClientMediaCall, CallState, CallActorType, CallContact } from '../definition/call';
import type { IMediaSignalLogger } from '../definition/logger';

export type MediaSignalingEvents = {
	callContactUpdate: { call: IClientMediaCall };
	callStateChange: { call: IClientMediaCall; oldState: CallState };
	callClientStateChange: { call: IClientMediaCall; oldState: ClientState };
	newCall: { call: IClientMediaCall };
	acceptedCall: { call: IClientMediaCall };
	activeCall: { call: IClientMediaCall };
	endedCall: { call: IClientMediaCall };
	hiddenCall: { call: IClientMediaCall };
};

export type MediaSignalingSessionConfig = {
	userId: string;
	oldSessionId?: string;
	logger?: IMediaSignalLogger;
	processorFactories: IServiceProcessorFactoryList;
	mediaStreamFactory: MediaStreamFactory;
	transport: MediaSignalTransport<ClientMediaSignal>;
};

const STATE_REPORT_INTERVAL = 60000;

export class MediaSignalingSession extends Emitter<MediaSignalingEvents> {
	private _userId: string;

	private readonly _sessionId: string;

	private knownCalls: Map<string, ClientMediaCall>;

	private ignoredCalls: Set<string>;

	private transporter: MediaSignalTransportWrapper;

	private recurringStateReportHandler: ReturnType<typeof setInterval> | null;

	private callCount = 0;

	public get sessionId(): string {
		return this._sessionId;
	}

	public get userId(): string {
		return this._userId;
	}

	constructor(private config: MediaSignalingSessionConfig) {
		super();
		this._userId = config.userId;
		this._sessionId = this.createWeakToken();
		this.recurringStateReportHandler = null;
		this.knownCalls = new Map<string, ClientMediaCall>();
		this.ignoredCalls = new Set<string>();

		this.transporter = new MediaSignalTransportWrapper(this._sessionId, config.transport, config.logger);

		this.register();
		this.enableStateReport(STATE_REPORT_INTERVAL);
	}

	public isBusy(): boolean {
		const call = this.getMainCall();
		if (!call) {
			return false;
		}

		return ['accepted', 'active'].includes(call.state);
	}

	public enableStateReport(interval: number): void {
		this.disableStateReport();

		this.recurringStateReportHandler = setInterval(() => {
			this.reportState();
		}, interval);
	}

	public disableStateReport(): void {
		if (this.recurringStateReportHandler) {
			clearInterval(this.recurringStateReportHandler);
			this.recurringStateReportHandler = null;
		}
	}

	public getCallData(callId: string): IClientMediaCall | null {
		return this.knownCalls.get(callId) || null;
	}

	public getMainCall(): IClientMediaCall | null {
		let ringingCall: IClientMediaCall | null = null;
		let pendingCall: IClientMediaCall | null = null;

		for (const call of this.knownCalls.values()) {
			if (call.state === 'hangup' || call.ignored) {
				continue;
			}

			if (['accepted', 'active'].includes(call.state)) {
				return call;
			}
			if (call.state === 'ringing' && !ringingCall) {
				ringingCall = call;
				continue;
			}
			if (call.state === 'none' && !pendingCall) {
				pendingCall = call;
				continue;
			}
		}
		return ringingCall || pendingCall;
	}

	public async processSignal(signal: ServerMediaSignal): Promise<void> {
		this.config.logger?.debug('MediaSignalingSession.processSignal', signal);
		if (this.isSignalTargetingAnotherSession(signal) || this.isCallIgnored(signal.callId)) {
			return;
		}

		const call = this.getOrCreateCallBySignal(signal);

		if (signal.type === 'notification' && signal.signedContractId) {
			if (signal.signedContractId === this._sessionId) {
				call.setContractState('signed');
			} else if (signal.notification === 'accepted') {
				// The server accepted a contract, but it wasn't ours - ignore the call in this session
				call.setContractState('ignored');
			}
		}

		await call.processSignal(signal);
	}

	public async startCall(calleeType: CallActorType, calleeId: string, contactInfo?: CallContact): Promise<void> {
		this.config.logger?.debug('MediaSignalingSession.startCall', calleeId);
		const callId = this.createTemporaryCallId();
		const call = this.createCall(callId);

		await call.requestCall({ type: calleeType, id: calleeId }, contactInfo);
	}

	private createTemporaryCallId(): string {
		this.callCount++;
		return `${this._sessionId}-${this.callCount}-${Date.now()}`;
	}

	private isSignalTargetingAnotherSession(signal: ServerMediaSignal): boolean {
		if (signal.type === 'new' || signal.type === 'notification') {
			return false;
		}

		if (signal.toContractId && signal.toContractId !== this._sessionId) {
			return true;
		}

		return false;
	}

	private isCallIgnored(callId: string): boolean {
		return this.ignoredCalls.has(callId);
	}

	private ignoreCall(callId: string) {
		this.config.logger?.debug('MediaSignalingSession.ignoreCall', callId);
		this.ignoredCalls.add(callId);

		if (this.knownCalls.has(callId)) {
			const call = this.knownCalls.get(callId);
			this.knownCalls.delete(callId);

			call?.ignore();
		}
	}

	private getExistingCallBySignal(signal: ServerMediaSignal): ClientMediaCall | null {
		const existingCall = this.knownCalls.get(signal.callId);
		if (existingCall) {
			return existingCall;
		}

		if (signal.type === 'new' && signal.requestedCallId) {
			const localCall = this.knownCalls.get(signal.requestedCallId);
			if (localCall) {
				this.knownCalls.set(signal.callId, localCall);
				return localCall;
			}
		}

		return null;
	}

	private getOrCreateCallBySignal(signal: ServerMediaSignal): ClientMediaCall {
		this.config.logger?.debug('MediaSignalingSession.getOrCreateCallBySignal', signal);
		const existingCall = this.getExistingCallBySignal(signal);
		if (existingCall) {
			return existingCall;
		}

		return this.createCall(signal.callId);
	}

	private reportState(): void {
		const call = this.getMainCall() as ClientMediaCall | null;
		if (call && !call.isOver()) {
			call.reportStates();
			return;
		}

		// If we don't have any call to report the state on, send a register signal instead; the server will ignore it if there's nothing on that side either
		this.register();
	}

	private register(): void {
		this.transporter.sendSignal({
			type: 'register',
			contractId: this._sessionId,
			...(this.config.oldSessionId && { oldContractId: this.config.oldSessionId }),
		});
	}

	private createCall(callId: string): ClientMediaCall {
		this.config.logger?.debug('MediaSignalingSession.createCall');
		const config = {
			logger: this.config.logger,
			transporter: this.transporter,
			processorFactories: this.config.processorFactories,
			mediaStreamFactory: this.config.mediaStreamFactory,
		};

		const call = new ClientMediaCall(config, callId);
		this.knownCalls.set(callId, call);

		call.emitter.on('contactUpdate', () => this.onCallContactUpdate(call));
		call.emitter.on('stateChange', (oldState) => this.onCallStateChange(call, oldState));
		call.emitter.on('clientStateChange', (oldState) => this.onCallClientStateChange(call, oldState));
		call.emitter.on('initialized', () => this.onNewCall(call));
		call.emitter.on('accepted', () => this.onAcceptedCall(call));
		call.emitter.on('hidden', () => this.onHiddenCall(call));
		call.emitter.on('active', () => this.onActiveCall(call));
		call.emitter.on('ended', () => this.onEndedCall(call));

		return call;
	}

	private createWeakToken(): string {
		const base = 32;
		const size = 8;

		let token = '';
		for (let i = 0; i < size; i++) {
			const r: number = Math.floor(Math.random() * base);
			token += r.toString(base);
		}
		return `${Date.now()}-${token}`;
	}

	private onCallContactUpdate(call: ClientMediaCall): void {
		this.config.logger?.debug('MediaSignalingSession.onCallContactUpdate');
		if (call.hidden) {
			return;
		}

		this.emit('callContactUpdate', { call });
	}

	private onCallStateChange(call: ClientMediaCall, oldState: CallState): void {
		this.config.logger?.debug('MediaSignalingSession.onCallStateChange');
		if (call.hidden && call.state !== 'hangup') {
			return;
		}

		this.emit('callStateChange', { call, oldState });
	}

	private onCallClientStateChange(call: ClientMediaCall, oldState: ClientState): void {
		this.config.logger?.debug('MediaSignalingSession.onCallClientStateChange');
		if (call.hidden && call.state !== 'hangup') {
			return;
		}

		this.emit('callClientStateChange', { call, oldState });
	}

	private onNewCall(call: ClientMediaCall): void {
		this.config.logger?.debug('MediaSignalingSession.onNewCall');
		if (call.hidden) {
			return;
		}

		this.emit('newCall', { call });
	}

	private onAcceptedCall(call: ClientMediaCall): void {
		this.config.logger?.debug('MediaSignalingSession.onAcceptedCall');
		if (call.hidden) {
			return;
		}

		this.emit('acceptedCall', { call });
	}

	private onEndedCall(call: ClientMediaCall): void {
		this.config.logger?.debug('MediaSignalingSession.onEndedCall');
		this.ignoreCall(call.callId);
		this.emit('endedCall', { call });
	}

	private onHiddenCall(call: ClientMediaCall): void {
		this.config.logger?.debug('MediaSignalingSession.onHiddenCall');
		this.emit('hiddenCall', { call });
	}

	private onActiveCall(call: ClientMediaCall): void {
		this.config.logger?.debug('MediaSignalingSession.onActiveCall');
		this.emit('activeCall', { call });
	}
}
