import { Emitter } from '@rocket.chat/emitter';

import { ClientMediaCall } from './Call';
import { MediaSignalTransportWrapper } from './TransportWrapper';
import type {
	ClientMediaSignal,
	IServiceProcessorFactoryList,
	MediaSignalTransport,
	MediaStreamFactory,
	ServerMediaSignal,
} from '../definition';
import { createRandomToken } from './utils/createRandomToken';
import type { IClientMediaCall, CallState, CallActorType, CallContact } from '../definition/call';

export type MediaSignalingEvents = {
	callContactUpdate: { call: IClientMediaCall };
	callStateChange: { call: IClientMediaCall; oldState: CallState };
	newCall: { call: IClientMediaCall };
	acceptedCall: { call: IClientMediaCall };
	endedCall: { call: IClientMediaCall };
};

export type MediaSignalingSessionConfig = {
	userId: string;
	processorFactories: IServiceProcessorFactoryList;
	mediaStreamFactory: MediaStreamFactory;
	transport: MediaSignalTransport<ClientMediaSignal>;
};

export class MediaSignalingSession extends Emitter<MediaSignalingEvents> {
	private _userId: string;

	private readonly _sessionId: string;

	private knownCalls: Map<string, ClientMediaCall>;

	private ignoredCalls: Set<string>;

	private transporter: MediaSignalTransportWrapper;

	public get sessionId(): string {
		return this._sessionId;
	}

	public get userId(): string {
		return this._userId;
	}

	constructor(private config: MediaSignalingSessionConfig) {
		super();
		this._userId = config.userId;
		this._sessionId = createRandomToken(8);
		this.knownCalls = new Map<string, ClientMediaCall>();
		this.ignoredCalls = new Set<string>();

		this.transporter = new MediaSignalTransportWrapper(this._sessionId, config.transport);
	}

	public isBusy(): boolean {
		const call = this.getMainCall();
		if (!call) {
			return false;
		}

		return ['accepted', 'active'].includes(call.state);
	}

	public getCallData(callId: string): IClientMediaCall | null {
		return this.knownCalls.get(callId) || null;
	}

	public getMainCall(): IClientMediaCall | null {
		let ringingCall: IClientMediaCall | null = null;
		let pendingCall: IClientMediaCall | null = null;

		for (const call of this.knownCalls.values()) {
			if (['accepted', 'active'].includes(call.state)) {
				return call;
			}
			if (call.state === 'ringing' && !ringingCall) {
				ringingCall = call;
				continue;
			}
			if (call.state === 'none') {
				pendingCall = call;
				continue;
			}
		}
		return ringingCall || pendingCall;
	}

	public async processSignal(signal: ServerMediaSignal): Promise<void> {
		console.log('session.processSignal', signal.type);
		if (this.isSignalTargetingAnotherSession(signal) || this.isCallIgnored(signal.callId)) {
			return;
		}

		const call = await this.getOrCreateCallBySignal(signal);
		await call.processSignal(signal);
	}

	public async startCall(calleeType: CallActorType, calleeId: string, contactInfo?: CallContact): Promise<void> {
		const callId = this.createTemporaryCallId();
		const call = await this.createCall(callId);

		await call.requestCall({ type: calleeType, id: calleeId }, contactInfo);
	}

	private createTemporaryCallId(): string {
		const callId = createRandomToken(20);

		if (this.knownCalls.has(callId)) {
			return this.createTemporaryCallId();
		}

		return callId;
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
		this.ignoredCalls.add(callId);

		if (this.knownCalls.has(callId)) {
			this.knownCalls.delete(callId);
		}
	}

	private async getOrCreateCall(callId: string, localCallId?: string): Promise<ClientMediaCall> {
		const existingCall = this.knownCalls.get(callId);
		if (existingCall) {
			return existingCall;
		}

		const localCall = localCallId && this.knownCalls.get(localCallId);
		if (localCall) {
			this.knownCalls.set(callId, localCall);
			return localCall;
		}

		return this.createCall(callId);
	}

	private async getOrCreateCallBySignal(signal: ServerMediaSignal): Promise<ClientMediaCall> {
		if (signal.type === 'new') {
			return this.getOrCreateCall(signal.callId, signal.requestedCallId);
		}

		return this.getOrCreateCall(signal.callId);
	}

	private async createCall(callId: string): Promise<ClientMediaCall> {
		const config = {
			transporter: this.transporter,
			processorFactories: this.config.processorFactories,
			mediaStreamFactory: this.config.mediaStreamFactory,
		};

		const call = new ClientMediaCall(config, callId);
		this.knownCalls.set(callId, call);

		call.emitter.on('contactUpdate', () => this.emit('callContactUpdate', { call }));
		call.emitter.on('stateChange', (oldState) => this.emit('callStateChange', { call, oldState }));
		call.emitter.on('initialized', () => this.emit('newCall', { call }));
		call.emitter.on('accepted', () => this.emit('acceptedCall', { call }));
		call.emitter.on('ended', () => {
			this.ignoreCall(call.callId);
			this.emit('endedCall', { call });
		});

		return call;
	}
}
