import { Emitter } from '@rocket.chat/emitter';

import { ClientMediaCall } from './Call';
import { MediaSignalTransportWrapper } from './TransportWrapper';
import { createRandomToken } from './utils/createRandomToken';
import type { IServiceProcessorFactoryList } from '../definition/IServiceProcessorFactoryList';
import type { MediaSignal } from '../definition/MediaSignal';
import type { MediaSignalAgentTransport } from '../definition/MediaSignalTransport';
import type { MediaStreamFactory } from '../definition/MediaStreamFactory';
import type { IClientMediaCall, CallState } from '../definition/call';

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
	transport: MediaSignalAgentTransport;
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

	public async processSignal(signal: MediaSignal): Promise<void> {
		console.log('session.processSignal', signal.type);
		if (this.isSignalTargetingAnotherSession(signal) || this.isCallIgnored(signal.callId)) {
			return;
		}

		const call = await this.getOrCreateCall(signal.callId);
		await call.processSignal(signal);
	}

	public async registerOutboundCall(callId: string, contact: Record<string, string>): Promise<void> {
		const call = await this.getOrCreateCall(callId);

		return call.initializeOutboundCall(contact);
	}

	private isSignalTargetingAnotherSession(signal: MediaSignal): boolean {
		if ('sessionId' in signal && signal.sessionId && signal.sessionId !== this._sessionId) {
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

	private async getOrCreateCall(callId: string): Promise<ClientMediaCall> {
		const existingCall = this.knownCalls.get(callId);
		if (existingCall) {
			return existingCall;
		}

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
