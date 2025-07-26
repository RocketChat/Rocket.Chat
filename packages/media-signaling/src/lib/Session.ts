import { Emitter } from '@rocket.chat/emitter';

import { ClientMediaCall } from './Call';
import { MediaSignalTransportWrapper } from './TransportWrapper';
import type { IWebRTCProcessor, MediaSignalNotify } from '../definition';
import { createRandomToken } from './utils/createRandomToken';
import type { IServiceProcessorFactoryList } from '../definition/IServiceProcessorFactoryList';
import type { IClientMediaCall, IClientMediaCallData, CallContact, CallState } from '../definition/call';
import { isNotifyNew } from './utils/isNotifyNew';
import type { MediaSignalTransport } from '../definition/MediaSignalTransport';
import { isCallRole } from '../definition/call/CallRole';
import type { MediaSignal } from '../definition/signal/MediaSignal';

const stateWeights: Record<CallState, number> = {
	none: 0,
	ringing: 1,
	accepted: 2,
	error: 3,
	active: 4,
} as const;

export type MediaSignalingEvents = {
	callStateChange: { call: IClientMediaCall; oldState: CallState };
	newCall: { call: IClientMediaCall };
};

export type MediaSignalingSessionConfig = {
	userId: string;
	processorFactories: IServiceProcessorFactoryList;
	transport: MediaSignalTransport;
};

export class MediaSignalingSession extends Emitter<MediaSignalingEvents> {
	private _userId: string;

	private readonly _sessionId: string;

	private knownCalls: Map<string, ClientMediaCall>;

	// Store contact information for calls that are not yet known
	private contactInformation: Map<string, CallContact>;

	private ignoredCalls: Set<string>;

	private failedCalls: Set<string>;

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
		this.contactInformation = new Map<string, CallContact>();
		this.ignoredCalls = new Set<string>();
		this.failedCalls = new Set<string>();

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
		if (this.isSignalTargetingAnotherSession(signal)) {
			return;
		}

		if (this.isCallIgnored(signal.callId)) {
			if (signal.sessionId) {
				console.error('Received targeted signal for an ignored call.', signal);
			}

			return;
		}

		if (isNotifyNew(signal)) {
			await this.processNewCall(signal);
			return;
		}

		const call = this.knownCalls.get(signal.callId);
		if (!call) {
			if (this.failedCalls.has(signal.callId)) {
				// do something?
				return;
			}

			// #ToDo: Hold on to unexpected untargeted signals for a few seconds and process them if a notifyNew arrives
			console.error('Unexpected Signal', signal);
			throw new Error('Unexpected Signal received.');
		}

		await call.processSignal(signal);
	}

	public getStoredCallContact(callId: string): CallContact {
		return {
			...this.contactInformation.get(callId),
			...this.knownCalls.get(callId)?.contact,
		};
	}

	public setCallContact(callId: string, contact: Record<string, string>): void {
		const oldContact = this.getStoredCallContact(callId);
		const fullContact = { ...oldContact, ...contact };

		const call = this.knownCalls.get(callId);
		if (!call) {
			this.contactInformation.set(callId, fullContact);
			return;
		}

		call.setContact(fullContact);
		if (this.contactInformation.has(callId)) {
			this.contactInformation.delete(callId);
		}
	}

	private isSignalTargetingAnotherSession(signal: MediaSignal): boolean {
		if (!signal.sessionId) {
			return false;
		}

		return signal.sessionId !== this._sessionId;
	}

	private isCallKnown(callId: string): boolean {
		return this.knownCalls.has(callId);
	}

	private isCallIgnored(callId: string): boolean {
		return this.ignoredCalls.has(callId);
	}

	private async processNewCall(signal: MediaSignalNotify<'new'>) {
		// If we already know about this call, we don't need to process anything
		if (this.isCallKnown(signal.callId)) {
			return;
		}

		try {
			if (!isCallRole(signal.role)) {
				throw new Error('invalid-role');
			}

			// Contact will probaby already be stored if this call was requested by this same session
			const contact = this.getStoredCallContact(signal.callId);
			const callData: IClientMediaCallData = {
				callId: signal.callId,
				role: signal.role,
				state: 'none',
				service: signal.body.service,
				ignored: this.isCallIgnored(signal.callId) || this.isBusy(),
				contact,
			};

			const call = await this.registerCall(callData);

			await call.initialize(signal);

			this.emit('newCall', { call });
		} catch (e) {
			this.failedCalls.add(signal.callId);
			const errorCode: string = (e && typeof e === 'object' && (e as any).name) || 'call-initialization-failed';

			this.transporter.sendError(signal, errorCode);
			throw e;
		}
	}

	private async registerCall(callData: IClientMediaCallData): Promise<ClientMediaCall> {
		const webrtcProcessor = await this.createWebRtcProcessor();

		const config = {
			transporter: this.transporter,
			webrtcProcessor,
		};

		const call = new ClientMediaCall(config, callData);

		this.knownCalls.set(call.callId, call);
		return call;
	}

	private async createWebRtcProcessor(): Promise<IWebRTCProcessor> {
		const { webrtc: webrtcFactory } = this.config.processorFactories;

		if (!webrtcFactory) {
			throw new Error('webrtc-not-implemented');
		}

		return webrtcFactory();
	}
}
