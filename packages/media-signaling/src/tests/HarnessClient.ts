import type { SignalingEndpoint } from './FakeSignalingServer';
import type {
	AnyMediaCallData,
	CallActorType,
	CallContact,
	CallEvents,
	CallFeature,
	ClientMediaSignal,
	ClientMediaSignalType,
	ClientState,
	IClientMediaCall,
	IMediaSignalLogger,
	IMediaStreamWrapper,
	MediaSignalTransport,
} from '../definition';
import { createFakeAudioStream, createFakeDisplayStream } from './webrtc/FakeMediaStream';
import type { FakeMediaStreamTrack } from './webrtc/FakeMediaStreamTrack';
import { asFakeTrack } from './webrtc/FakeMediaStreamTrack';
import type { ClientMediaCall } from '../lib/Call';
import type { MediaSignalingEvents } from '../lib/Session';
import { MediaSignalingSession } from '../lib/Session';
import { MediaCallWebRTCProcessor } from '../lib/services/webrtc/Processor';

export type HarnessClientOptions = {
	userId: string;
	/** Prefix of the generated session id; the harness derives a unique one per client. */
	label?: string;
	username?: string;
	displayName?: string;
	features?: CallFeature[];
	autoSync?: boolean;
	mobileDeviceId?: string;
	oldSessionId?: string;
	iceGatheringTimeout?: number;
	iceServers?: RTCIceServer[];
	/** Makes the microphone request fail, as a browser does when the user denies permission. */
	denyMicrophone?: boolean;
	/** Makes the screen capture request fail, as a browser does when the user cancels the picker. */
	denyDisplayMedia?: boolean;
	logger?: IMediaSignalLogger;
};

export type RecordedSessionEvent = { name: keyof MediaSignalingEvents; payload: unknown };

export type RecordedCallEvent = { callId: string; name: keyof CallEvents; payload: unknown };

const SESSION_EVENT_NAMES: (keyof MediaSignalingEvents)[] = [
	'sessionStateChange',
	'newCall',
	'acceptedCall',
	'endedCall',
	'droppedCall',
	'hiddenCall',
	'registered',
	'outOfSync',
];

const CALL_EVENT_NAMES: (keyof CallEvents)[] = [
	'stateChange',
	'clientStateChange',
	'trackStateChange',
	'contactUpdate',
	'initialized',
	'confirmed',
	'accepting',
	'accepted',
	'active',
	'hidden',
	'ended',
	'screenShareRequestChange',
	'streamChange',
];

const getRequestedDeviceId = (constraints: MediaStreamConstraints): string | undefined => {
	const { audio } = constraints;
	if (!audio || typeof audio === 'boolean') {
		return undefined;
	}

	const { deviceId } = audio;
	if (typeof deviceId === 'string') {
		return deviceId;
	}

	return undefined;
};

/**
 * One client of the harness: a real `MediaSignalingSession` wired to the fake server and the fake
 * WebRTC stack, plus the recordings and shortcuts a test asserts on.
 */
export class HarnessClient {
	public readonly session: MediaSignalingSession;

	public readonly sentSignals: ClientMediaSignal[] = [];

	public readonly events: RecordedSessionEvent[] = [];

	public readonly callEvents: RecordedCallEvent[] = [];

	/** The constraints of every microphone request, in order. */
	public readonly microphoneRequests: MediaStreamConstraints[] = [];

	public readonly displayMediaRequests: MediaStreamConstraints[] = [];

	private randomStringCount = 0;

	private readonly recordedCalls = new Set<string>();

	public get userId(): string {
		return this.options.userId;
	}

	public get label(): string {
		return this.options.label || this.options.userId;
	}

	public get sessionId(): string {
		return this.session.sessionId;
	}

	public get registered(): boolean {
		return this.session.registered;
	}

	/**
	 * The call this session would show to the user, or null when it would show none.
	 *
	 * Typed as the concrete call because the harness always builds real ones, which lets a test read
	 * the states `IClientMediaCall` keeps to itself, such as `remoteHeld`.
	 */
	public get call(): ClientMediaCall | null {
		return (this.session.getState()?.call as ClientMediaCall | undefined) || null;
	}

	public get callData(): AnyMediaCallData | null {
		return this.session.getState() || null;
	}

	public get callState(): IClientMediaCall['state'] | null {
		return this.call?.state || null;
	}

	/** The finer-grained state the session reports to the server, which `callState` collapses. */
	public get clientState(): ClientState | null {
		return this.call?.getClientState() || null;
	}

	constructor(
		private readonly options: HarnessClientOptions,
		endpoint: SignalingEndpoint,
		private readonly settle: () => Promise<void>,
	) {
		const transport: MediaSignalTransport<ClientMediaSignal> = (signal) => {
			this.sentSignals.push(signal);
			endpoint.transport(signal);
		};

		this.session = new MediaSignalingSession({
			userId: options.userId,
			...(options.logger && { logger: options.logger }),
			...(options.mobileDeviceId && { mobileDeviceId: options.mobileDeviceId }),
			...(options.oldSessionId && { oldSessionId: options.oldSessionId }),
			processorFactories: { webrtc: (config) => new MediaCallWebRTCProcessor(config) },
			mediaStreamFactory: async (constraints) => {
				this.microphoneRequests.push(constraints);

				if (options.denyMicrophone) {
					throw new Error('NotAllowedError');
				}

				const deviceId = getRequestedDeviceId(constraints);
				return createFakeAudioStream(deviceId ? { deviceId } : {});
			},
			displayMediaFactory: async (constraints) => {
				this.displayMediaRequests.push(constraints);

				if (options.denyDisplayMedia) {
					throw new Error('NotAllowedError');
				}

				return createFakeDisplayStream();
			},
			randomStringFactory: () => {
				this.randomStringCount++;
				return `${this.label}-random-${this.randomStringCount}`;
			},
			transport,
			iceGatheringTimeout: options.iceGatheringTimeout ?? 5000,
			iceServers: options.iceServers || [],
			features: options.features || ['audio', 'screen-share', 'transfer', 'hold'],
			...(options.autoSync !== undefined && { autoSync: options.autoSync }),
		});

		endpoint.attach(this.session);
		this.recordSessionEvents();
	}

	public async startCall(calleeId: string, params: { calleeType?: CallActorType; contactInfo?: CallContact } = {}): Promise<void> {
		await this.session.startCall(params.calleeType || 'user', calleeId, params.contactInfo ? { contactInfo: params.contactInfo } : {});
		await this.settle();
	}

	public async accept(): Promise<void> {
		this.requireCall().accept();
		await this.settle();
	}

	public async reject(): Promise<void> {
		this.requireCall().reject();
		await this.settle();
	}

	public async hangup(): Promise<void> {
		this.requireCall().hangup();
		await this.settle();
	}

	public async setMuted(muted: boolean): Promise<void> {
		this.requireCall().localParticipant.setMuted(muted);
		await this.settle();
	}

	public async setHeld(held: boolean): Promise<void> {
		this.requireCall().localParticipant.setHeld(held);
		await this.settle();
	}

	public async requestScreenShare(requested: boolean): Promise<void> {
		this.requireCall().requestScreenShare(requested);
		await this.settle();
	}

	public async transfer(calleeId: string, calleeType: CallActorType = 'user'): Promise<void> {
		this.requireCall().transfer({ type: calleeType, id: calleeId });
		await this.settle();
	}

	public async sendDTMF(dtmf: string, duration?: number): Promise<void> {
		this.requireCall().sendDTMF(dtmf, duration);
		await this.settle();
	}

	public async setDeviceId(deviceId: ConstrainDOMString | null, force?: boolean): Promise<void> {
		await this.session.setDeviceId(deviceId, force);
		await this.settle();
	}

	public localStream(tag = 'main'): IMediaStreamWrapper | null {
		return this.call?.localParticipant.getMediaStream(tag) || null;
	}

	public remoteStream(tag = 'main'): IMediaStreamWrapper | null {
		return this.call?.remoteParticipants[0]?.getMediaStream(tag) || null;
	}

	/** The remote audio track the fake peer connection delivered, so a test can drive its state. */
	public remoteAudioTrack(tag = 'main'): FakeMediaStreamTrack | null {
		const [track] = this.remoteStream(tag)?.stream.getAudioTracks() || [];

		return track ? asFakeTrack(track) : null;
	}

	public signalsOfType<T extends ClientMediaSignalType>(type: T): Extract<ClientMediaSignal, { type: T }>[] {
		return this.sentSignals.filter((signal): signal is Extract<ClientMediaSignal, { type: T }> => signal.type === type);
	}

	public lastSignalOfType<T extends ClientMediaSignalType>(type: T): Extract<ClientMediaSignal, { type: T }> | null {
		const signals = this.signalsOfType(type);

		return signals[signals.length - 1] || null;
	}

	public eventNames(): (keyof MediaSignalingEvents)[] {
		return this.events.map(({ name }) => name);
	}

	public countEvents(name: keyof MediaSignalingEvents): number {
		return this.events.filter((event) => event.name === name).length;
	}

	public callEventNames(callId?: string): (keyof CallEvents)[] {
		return this.callEvents.filter((event) => !callId || event.callId === callId).map(({ name }) => name);
	}

	/** Records every event of a call the session never surfaced through 'newCall', such as a hidden one. */
	public recordCallEvents(call: IClientMediaCall): void {
		if (this.recordedCalls.has(call.callId)) {
			return;
		}

		this.recordedCalls.add(call.callId);

		for (const name of CALL_EVENT_NAMES) {
			call.emitter.on(name, (payload: unknown) => {
				this.callEvents.push({ callId: call.callId, name, payload });
			});
		}
	}

	public dispose(): void {
		this.session.endSession();
	}

	private requireCall(): ClientMediaCall {
		const { call } = this;
		if (!call) {
			throw new Error(`Session ${this.sessionId} has no call to act on.`);
		}

		return call;
	}

	private recordSessionEvents(): void {
		for (const name of SESSION_EVENT_NAMES) {
			this.session.on(name, (payload: unknown) => {
				this.events.push({ name, payload });
			});
		}

		this.session.on('newCall', ({ call }) => this.recordCallEvents(call));
	}
}
