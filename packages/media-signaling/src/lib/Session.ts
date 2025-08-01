import { Emitter } from '@rocket.chat/emitter';

import { ClientMediaCall } from './Call';
import { MediaSignalTransportWrapper } from './TransportWrapper';
import { createRandomToken } from './utils/createRandomToken';
import type { IServiceProcessorFactoryList } from '../definition/IServiceProcessorFactoryList';
import type { MediaSignal } from '../definition/MediaSignal';
import type { MediaSignalTransport } from '../definition/MediaSignalTransport';
import type { MediaStreamFactory } from '../definition/MediaStreamFactory';
import type { IClientMediaCall, CallState } from '../definition/call';

const stateWeights: Record<CallState, number> = {
	none: 0,
	ringing: 1,
	accepted: 2,
	active: 3,
	hangup: -1,
} as const;

export type MediaSignalingEvents = {
	callStateChange: { call: IClientMediaCall; oldState: CallState };
	newCall: { call: IClientMediaCall };
	acceptedCall: { call: IClientMediaCall };
	endedCall: { call: IClientMediaCall };
};

export type MediaSignalingSessionConfig = {
	userId: string;
	processorFactories: IServiceProcessorFactoryList;
	mediaStreamFactory: MediaStreamFactory;
	transport: MediaSignalTransport;
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
		return this.hasAnyCallState(['ringing', 'accepted', 'active']);
	}

	public getCallData(callId: string): IClientMediaCall | null {
		return this.knownCalls.get(callId) || null;
	}

	public getAllCallStates(): CallState[] {
		return this.knownCalls
			.values()
			.map(({ state }) => state)
			.toArray();
	}

	public hasAnyCallState(states: CallState[]): boolean {
		const knownStates = this.getAllCallStates();
		for (const state of knownStates) {
			if (states.includes(state)) {
				return true;
			}
		}
		return false;
	}

	public getSortedCalls(): IClientMediaCall[] {
		return this.knownCalls
			.values()
			.toArray()
			.sort((call1, call2) => {
				const call1Weight = stateWeights[call1.state] || 0;
				const call2Weight = stateWeights[call2.state] || 0;

				return call2Weight - call1Weight;
			});
	}

	public getMainCall(): IClientMediaCall | null {
		const call = this.getSortedCalls().pop();
		if (call) {
			return this.getCallData(call.callId);
		}
		return null;
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
		if (!signal.sessionId) {
			return false;
		}

		return signal.sessionId !== this._sessionId;
	}

	private isCallIgnored(callId: string): boolean {
		return this.ignoredCalls.has(callId);
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

		call.emitter.on('stateChange', (oldState) => this.emit('callStateChange', { call, oldState }));
		call.emitter.on('accepted', () => this.emit('acceptedCall', { call }));
		call.emitter.on('ended', () => {
			this.ignoredCalls.add(call.callId);
			this.emit('endedCall', { call });
		});

		this.emit('newCall', { call });

		return call;
	}
}
