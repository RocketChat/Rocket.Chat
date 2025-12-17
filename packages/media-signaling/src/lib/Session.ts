import { Emitter } from '@rocket.chat/emitter';

import { ClientMediaCall } from './Call';
import { MediaSignalTransportWrapper } from './TransportWrapper';
import type {
	ClientMediaSignal,
	IServiceProcessorFactoryList,
	MediaSignalTransport,
	MediaStreamFactory,
	RandomStringFactory,
	ServerMediaSignal,
} from '../definition';
import type { IClientMediaCall, CallActorType, CallContact } from '../definition/call';
import type { IMediaSignalLogger } from '../definition/logger';

export type MediaSignalingEvents = {
	sessionStateChange: void;
	newCall: { call: IClientMediaCall };
	acceptedCall: { call: IClientMediaCall };
	endedCall: void;
	hiddenCall: void;
};

export type MediaSignalingSessionConfig = {
	userId: string;
	oldSessionId?: string;
	logger?: IMediaSignalLogger;
	processorFactories: IServiceProcessorFactoryList;
	mediaStreamFactory: MediaStreamFactory;
	randomStringFactory: RandomStringFactory;
	transport: MediaSignalTransport<ClientMediaSignal>;
	iceGatheringTimeout?: number;
	iceServers?: RTCIceServer[];
};

const STATE_REPORT_INTERVAL = 60000;

export class MediaSignalingSession extends Emitter<MediaSignalingEvents> {
	private _userId: string;

	private readonly _sessionId: string;

	private knownCalls: Map<string, ClientMediaCall>;

	private ignoredCalls: Set<string>;

	private transporter: MediaSignalTransportWrapper;

	private recurringStateReportHandler: ReturnType<typeof setInterval> | null;

	private inputTrack: MediaStreamTrack | null;

	private updatingInputTrack: boolean;

	private deviceId: ConstrainDOMString | null;

	private currentDeviceId: ConstrainDOMString | null;

	private callsToGetUserMedia: number;

	private lastRegisterTimestamp: Date | null = null;

	private lastState: { hasCall: boolean; hasVisibleCall: boolean; hasBusyCall: boolean };

	public get sessionId(): string {
		return this._sessionId;
	}

	public get userId(): string {
		return this._userId;
	}

	constructor(private config: MediaSignalingSessionConfig) {
		super();
		this._userId = config.userId;
		this._sessionId = config.randomStringFactory();
		this.recurringStateReportHandler = null;
		this.knownCalls = new Map<string, ClientMediaCall>();
		this.ignoredCalls = new Set<string>();
		this.inputTrack = null;
		this.updatingInputTrack = false;
		this.deviceId = null;
		this.currentDeviceId = null;
		this.callsToGetUserMedia = 0;
		this.lastState = { hasCall: false, hasVisibleCall: false, hasBusyCall: false };

		this.transporter = new MediaSignalTransportWrapper(this._sessionId, config.transport, config.logger);

		this.register();
		this.enableStateReport(STATE_REPORT_INTERVAL);
	}

	public isBusy(): boolean {
		return this.getMainCall(false)?.busy ?? false;
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

	public endSession(): void {
		this.disableStateReport();

		// best‑effort: stop capturing audio
		void this.setInputTrack(null).catch(() => undefined);

		for (const call of this.knownCalls.values()) {
			this.ignoredCalls.add(call.callId);
			call.ignore();
		}

		this.knownCalls.clear();
	}

	public getCallData(callId: string): IClientMediaCall | null {
		return this.knownCalls.get(callId) || null;
	}

	public getMainCall(skipLocal = false): IClientMediaCall | null {
		let ringingCall: IClientMediaCall | null = null;
		let pendingCall: IClientMediaCall | null = null;

		for (const call of this.knownCalls.values()) {
			if (call.state === 'hangup' || call.ignored) {
				continue;
			}
			if (skipLocal && !call.confirmed) {
				continue;
			}

			if (call.busy) {
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

		if (this.isCallIgnored(signal.callId)) {
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
		} else if ('toContractId' in signal) {
			call.setContractState(signal.toContractId === this._sessionId ? 'signed' : 'ignored');
		} else if (signal.type === 'new' && signal.self.contractId) {
			call.setContractState(signal.self.contractId === this._sessionId ? 'signed' : 'ignored');
		}

		const oldCall = this.getReplacedCallBySignal(signal);
		await call.processSignal(signal, oldCall);
	}

	public async setDeviceId(deviceId: ConstrainDOMString | null): Promise<void> {
		this.deviceId = deviceId;
		// do nothing if:
		// 1. doesn't have any input track yet
		// 2. it's the same device id
		// 3. has no restriction on which device to use
		if (!this.inputTrack || deviceId === this.currentDeviceId || !deviceId) {
			return;
		}

		this.config.logger?.debug('MediaSignalingSession.setDeviceId');
		await this.setInputTrack(null);
		await this.startInputTrack();
	}

	public async startCall(calleeType: CallActorType, calleeId: string, params: { contactInfo?: CallContact } = {}): Promise<void> {
		this.config.logger?.debug('MediaSignalingSession.startCall', calleeId);
		if (this.getMainCall(false)) {
			throw new Error(`Already on a call.`);
		}

		const { contactInfo } = params;

		const callId = this.createTemporaryCallId();
		const call = this.createCall(callId);

		await call.requestCall({ type: calleeType, id: calleeId }, contactInfo);
	}

	public register(): void {
		this.lastRegisterTimestamp = new Date();

		this.transporter.sendSignal({
			type: 'register',
			contractId: this._sessionId,
			...(this.config.oldSessionId && { oldContractId: this.config.oldSessionId }),
		});
	}

	public setIceGatheringTimeout(newTimeout: number): void {
		this.config.iceGatheringTimeout = newTimeout;
	}

	public setIceServers(iceServers: RTCIceServer[]): void {
		this.config.iceServers = iceServers;
	}

	private createTemporaryCallId(): string {
		return `${this._sessionId}-${this.config.randomStringFactory()}`;
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
				this.knownCalls.delete(signal.requestedCallId);
				return localCall;
			}
		}

		return null;
	}

	private getReplacedCallBySignal(signal: ServerMediaSignal): ClientMediaCall | null {
		if ('replacingCallId' in signal && signal.replacingCallId) {
			return this.knownCalls.get(signal.replacingCallId) || null;
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
		let reportedAny = false;
		let anyNotOver = false;

		for (const call of this.knownCalls.values()) {
			if (call.state !== 'hangup') {
				anyNotOver = true;
			}

			if (!call.isAbleToReportStates()) {
				continue;
			}

			reportedAny = true;
			call.reportStates();
		}

		if (reportedAny) {
			// If we're reporting a call's state, then ensure we'll register again once all calls over
			this.lastRegisterTimestamp = null;
			return;
		}

		// Even if we're not reporting any calls, if we know about one that isn't over, don't register
		if (anyNotOver) {
			return;
		}

		// By registering we're telling the server we have a clean session; if it's not supposed to be clean, it'll tell us
		this.autoRegister();
	}

	private autoRegister(): void {
		if (this.lastRegisterTimestamp) {
			const diff = Date.now() - this.lastRegisterTimestamp.valueOf();
			if (diff < STATE_REPORT_INTERVAL * 10) {
				return;
			}
		}

		this.register();
	}

	private async setInputTrack(newInputTrack: MediaStreamTrack | null): Promise<void> {
		this.config.logger?.debug('MediaSignalingSession.setInputTrack', Boolean(newInputTrack));
		const { inputTrack: oldInputTrack } = this;
		if (newInputTrack === oldInputTrack) {
			return;
		}

		this.inputTrack = newInputTrack;

		for await (const call of this.knownCalls.values()) {
			await call.setInputTrack(newInputTrack).catch((error) => {
				if (newInputTrack) {
					throw error;
				}
			});
		}

		if (oldInputTrack) {
			this.config.logger?.debug('MediaSignalingSession.setInputTrack.stopOldTrack');
			try {
				oldInputTrack.stop();
			} catch {
				//
			}
		}
	}

	private requestInputTrackUpdate(): void {
		if (this.updatingInputTrack || this.callsToGetUserMedia > 0) {
			return;
		}

		this.updateInputTrack().catch(() => null);
	}

	private async updateInputTrack(): Promise<void> {
		this.config.logger?.debug('MediaSignalingSession.updatingInputTrack', this.callsToGetUserMedia);
		this.updatingInputTrack = true;

		try {
			if (this.inputTrack) {
				await this.maybeStopInputTrack();
				return;
			}

			await this.maybeStartInputTrack();
		} finally {
			this.updatingInputTrack = false;
			this.config.logger?.debug('MediaSignalingSession.updatingInputTrack.finally', this.callsToGetUserMedia);
		}
	}

	private async maybeStartInputTrack(): Promise<void> {
		this.config.logger?.debug('MediaSignalingSession.maybeStartInputTrack');
		for (const call of this.knownCalls.values()) {
			if (!call.needsInputTrack()) {
				continue;
			}

			return this.startInputTrack();
		}
	}

	private getAudioConstraints(): boolean | MediaTrackConstraints {
		if (this.deviceId) {
			return { deviceId: this.deviceId };
		}

		return true;
	}

	private async startInputTrack(): Promise<void> {
		this.config.logger?.debug('MediaSignalingSession.startInputTrack', this.callsToGetUserMedia);

		this.currentDeviceId = this.deviceId;

		let userMedia: MediaStream | null = null;
		this.callsToGetUserMedia++;
		try {
			userMedia = await this.config.mediaStreamFactory({ audio: this.getAudioConstraints() }).catch(() => null);
		} finally {
			this.callsToGetUserMedia--;
		}

		this.config.logger?.debug('MediaSignalingSession.startInputTrack.done', this.callsToGetUserMedia);

		// If there's multiple simultaneous attempts to get the track, only process the output of the last one
		if (this.callsToGetUserMedia > 0) {
			return;
		}

		if (!userMedia) {
			return this.hangupCallsThatNeedInput();
		}

		const tracks = userMedia.getAudioTracks();
		if (!tracks.length) {
			return this.hangupCallsThatNeedInput();
		}

		return this.setInputTrack(tracks[0]);
	}

	private hangupCallsThatNeedInput(): void {
		this.config.logger?.debug('MediaSignalingSession.hangupCallsThatNeedInput');

		for (const call of this.knownCalls.values()) {
			if (!call.needsInputTrack()) {
				continue;
			}

			try {
				call.hangup('input-error');
			} catch {
				//
			}
		}
	}

	private async maybeStopInputTrack(): Promise<void> {
		this.config.logger?.debug('MediaSignalingSession.maybeStopInputTrack');
		for (const call of this.knownCalls.values()) {
			if (call.mayNeedInputTrack()) {
				return;
			}
		}

		await this.setInputTrack(null);
	}

	private createCall(callId: string): ClientMediaCall {
		this.config.logger?.debug('MediaSignalingSession.createCall');
		const config = {
			logger: this.config.logger,
			transporter: this.transporter,
			processorFactories: this.config.processorFactories,
			iceGatheringTimeout: this.config.iceGatheringTimeout || 5000,
			iceServers: this.config.iceServers || [],
			sessionId: this._sessionId,
		};

		const call = new ClientMediaCall(config, callId, { inputTrack: this.inputTrack });
		this.knownCalls.set(callId, call);

		call.emitter.on('contactUpdate', () => this.onCallContactUpdate(call));
		call.emitter.on('stateChange', () => this.onCallStateChange(call));
		call.emitter.on('clientStateChange', () => this.onCallClientStateChange(call));
		call.emitter.on('trackStateChange', () => this.onTrackStateChange(call));
		call.emitter.on('initialized', () => this.onNewCall(call));
		call.emitter.on('confirmed', () => this.onConfirmedCall(call));
		call.emitter.on('accepted', () => this.onAcceptedCall(call));
		call.emitter.on('accepting', () => this.onAcceptingCall(call));
		call.emitter.on('hidden', () => this.onHiddenCall(call));
		call.emitter.on('active', () => this.onActiveCall(call));
		call.emitter.on('ended', () => this.onEndedCall(call));

		return call;
	}

	private onCallContactUpdate(_call: ClientMediaCall): void {
		this.config.logger?.debug('MediaSignalingSession.onCallContactUpdate');
		this.onSessionStateChange();
	}

	private onCallStateChange(_call: ClientMediaCall): void {
		this.config.logger?.debug('MediaSignalingSession.onCallStateChange');
		this.onSessionStateChange();
	}

	private onCallClientStateChange(_call: ClientMediaCall): void {
		this.config.logger?.debug('MediaSignalingSession.onCallClientStateChange');
		this.onSessionStateChange();
	}

	private onNewCall(_call: ClientMediaCall): void {
		this.config.logger?.debug('MediaSignalingSession.onNewCall');
		this.onSessionStateChange();
	}

	private onConfirmedCall(_call: ClientMediaCall): void {
		this.config.logger?.debug('MediaSignalingSession.onConfirmedCall');
		this.onSessionStateChange();
	}

	private onAcceptedCall(_call: ClientMediaCall): void {
		this.config.logger?.debug('MediaSignalingSession.onAcceptedCall');
		this.onSessionStateChange();
	}

	private onAcceptingCall(_call: ClientMediaCall): void {
		this.config.logger?.debug('MediaSignalingSession.onAcceptingCall');
		this.onSessionStateChange();
	}

	private onTrackStateChange(_call: ClientMediaCall): void {
		this.config.logger?.debug('MediaSignalingSession.onTrackStateChange');
		this.onSessionStateChange();
	}

	private onEndedCall(call: ClientMediaCall): void {
		this.config.logger?.debug('MediaSignalingSession.onEndedCall');
		this.ignoreCall(call.callId);
		this.onSessionStateChange();
	}

	private onHiddenCall(_call: ClientMediaCall): void {
		this.config.logger?.debug('MediaSignalingSession.onHiddenCall');
		this.onSessionStateChange();
	}

	private onActiveCall(_call: ClientMediaCall): void {
		this.config.logger?.debug('MediaSignalingSession.onActiveCall');
		this.onSessionStateChange();
	}

	private onSessionStateChange(): void {
		const hadCall = this.lastState.hasCall;
		const hadVisibleCall = this.lastState.hasVisibleCall;
		const hadBusyCall = this.lastState.hasBusyCall;

		// Do not skip local calls if we transitioned from a different active call to it
		const mainCall = this.getMainCall(!hadCall);
		const hasCall = Boolean(mainCall);
		const hasVisibleCall = Boolean(mainCall && !mainCall.hidden);
		const hasBusyCall = Boolean(hasVisibleCall && mainCall?.busy);

		this.lastState = { hasCall, hasVisibleCall, hasBusyCall };

		if (mainCall && !hadCall) {
			this.emit('newCall', { call: mainCall });
		}
		if (mainCall && hasBusyCall && !hadBusyCall) {
			this.emit('acceptedCall', { call: mainCall });
		}

		this.emit('sessionStateChange');
		this.requestInputTrackUpdate();

		if (hadCall && !hasCall) {
			this.emit('endedCall');
		} else if (hadVisibleCall && !hasVisibleCall) {
			this.emit('hiddenCall');
		}
	}
}
