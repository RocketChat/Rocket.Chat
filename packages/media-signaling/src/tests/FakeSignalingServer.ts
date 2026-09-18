import type {
	CallActorType,
	CallContact,
	CallFeature,
	CallFlag,
	CallHangupReason,
	CallRejectedReason,
	CallService,
	ClientMediaSignal,
	ClientMediaSignalLocalState,
	ClientMediaSignalType,
	IMediaSignalLogger,
	MediaSignalTransport,
	ServerMediaSignal,
} from '../definition';
import { isClientMediaSignal } from '../definition/signals/client';

export type SignalingActor = { type: CallActorType; id: string };

export type ServerCallState = 'ringing' | 'accepted' | 'active' | 'hangup';

export type ServerCallRecord = {
	callId: string;
	/** The temporary id the caller's session used on its 'request-call' signal, absent on a transfer. */
	requestedCallId: string | null;
	service: CallService;
	caller: SignalingActor;
	callee: SignalingActor;
	callerContractId: string;
	/** Set once a callee session accepts; the contract the server signed for the callee. */
	calleeContractId: string | null;
	state: ServerCallState;
	features: CallFeature[];
	flags: CallFlag[];
	hangupReason: CallHangupReason | null;
	negotiationCount: number;
	replacingCallId?: string;
	transferredBy?: CallContact;
	unavailableContracts: Set<string>;
};

export type SignalingUserInfo = {
	username?: string;
	displayName?: string;
	sipExtension?: string;
};

export type FakeSignalingServerOptions = {
	logger?: IMediaSignalLogger;
	/** Features the server grants when a call is accepted, before the clients' own lists narrow them. */
	features?: CallFeature[];
	/** Flags the server puts on every new call. */
	flags?: CallFlag[];
	/** Rejects a call request from an actor that is already on a call, the way the real server does. */
	rejectWhenCallerIsBusy?: boolean;
	/** Validates every client signal against the package's own schema; leave on to catch protocol drift. */
	validateSignals?: boolean;
	/** Client signals the server throws away, so a test can see how a session handles a lost signal. */
	dropSignals?: ClientMediaSignalType[];
};

/** A session the server can reach, as seen from the server side. */
export interface SignalingSessionLike {
	readonly sessionId: string;
	processSignal(signal: ServerMediaSignal): Promise<void> | void;
}

export interface SignalingEndpoint {
	readonly userId: string;
	readonly transport: MediaSignalTransport<ClientMediaSignal>;
	attach(session: SignalingSessionLike): void;
	detach(): void;
}

type ServerSession = {
	contractId: string;
	userId: string;
	registered: boolean;
	session: SignalingSessionLike;
};

const ALL_FEATURES: CallFeature[] = ['audio', 'screen-share', 'transfer', 'hold'];

const MAX_TASKS_PER_FLUSH = 1000;

const intersectFeatures = (...lists: (CallFeature[] | undefined)[]): CallFeature[] => {
	const present = lists.filter((list): list is CallFeature[] => Array.isArray(list));
	if (!present.length) {
		return [];
	}

	return present.reduce((result, list) => result.filter((feature) => list.includes(feature)));
};

/**
 * The server half of the media signaling protocol, in memory.
 *
 * Client signals and server signals both go through a single queue that `flush()` drains, so a test
 * sees one deterministic order instead of whatever re-entrant order direct calls would produce.
 */
export class FakeSignalingServer {
	public readonly receivedSignals: ClientMediaSignal[] = [];

	public readonly calls = new Map<string, ServerCallRecord>();

	private readonly sessions = new Map<string, ServerSession>();

	private readonly userInfo = new Map<string, SignalingUserInfo>();

	private readonly callerFeatures = new Map<string, CallFeature[]>();

	private readonly reportedStates = new Map<string, Map<string, ClientMediaSignalLocalState>>();

	private readonly queue: (() => Promise<void> | void)[] = [];

	private readonly pendingRejections: CallRejectedReason[] = [];

	private callCount = 0;

	public get pendingCount(): number {
		return this.queue.length;
	}

	constructor(private readonly options: FakeSignalingServerOptions = {}) {}

	public setUserInfo(userId: string, info: SignalingUserInfo): void {
		this.userInfo.set(userId, { ...this.userInfo.get(userId), ...info });
	}

	public createEndpoint(userId: string): SignalingEndpoint {
		let attached: ServerSession | null = null;

		return {
			userId,
			transport: (signal: ClientMediaSignal) => {
				this.queue.push(() => this.handleClientSignal(userId, signal));
			},
			attach: (session: SignalingSessionLike) => {
				attached = { contractId: session.sessionId, userId, registered: false, session };
				this.sessions.set(session.sessionId, attached);
			},
			detach: () => {
				if (attached) {
					this.sessions.delete(attached.contractId);
					attached = null;
				}
			},
		};
	}

	/** Drains every queued signal; returns true when it delivered at least one. */
	public async flush(): Promise<boolean> {
		let delivered = false;

		for (let processed = 0; this.queue.length; processed++) {
			if (processed >= MAX_TASKS_PER_FLUSH) {
				throw new Error(
					`The fake signaling server kept exchanging signals after ${MAX_TASKS_PER_FLUSH} of them; the flow does not converge.`,
				);
			}

			const task = this.queue.shift();
			delivered = true;
			await task?.();
		}

		return delivered;
	}

	public getCall(callId: string): ServerCallRecord | null {
		return this.calls.get(callId) || null;
	}

	public callsForUser(userId: string): ServerCallRecord[] {
		return [...this.calls.values()].filter((call) => call.caller.id === userId || call.callee.id === userId);
	}

	public signalsOfType<T extends ClientMediaSignalType>(type: T, contractId?: string): Extract<ClientMediaSignal, { type: T }>[] {
		return this.receivedSignals.filter(
			(signal): signal is Extract<ClientMediaSignal, { type: T }> =>
				signal.type === type && (!contractId || signal.contractId === contractId),
		);
	}

	public reportedState(contractId: string, callId: string): ClientMediaSignalLocalState | null {
		return this.reportedStates.get(contractId)?.get(callId) || null;
	}

	/** Makes the server refuse the next call request, one reason per queued rejection. */
	public rejectNextCallRequest(reason: CallRejectedReason): void {
		this.pendingRejections.push(reason);
	}

	public hangupCall(callId: string, reason: CallHangupReason = 'normal'): void {
		const call = this.getCall(callId);
		if (call) {
			this.endCall(call, reason);
		}
	}

	public notifyActive(callId: string): void {
		const call = this.getCall(callId);
		if (!call || call.state === 'hangup') {
			return;
		}

		call.state = 'active';
		this.broadcast(call, { type: 'notification', callId: call.callId, notification: 'active' });
	}

	public notifyTrying(callId: string): void {
		const call = this.getCall(callId);
		if (!call || call.state === 'hangup') {
			return;
		}

		this.broadcast(call, { type: 'notification', callId: call.callId, notification: 'trying' });
	}

	public requestNewNegotiation(callId: string, contractId: string): string | null {
		const call = this.getCall(callId);
		if (!call || call.state === 'hangup') {
			return null;
		}

		return this.requestOffer(call, contractId);
	}

	/**
	 * Replaces one actor of an ongoing call with a new one and ends the original call as a transfer.
	 *
	 * The actor behind `requestedBy` keeps its place in the replacement call; by default that is the
	 * caller, so the callee is the one being transferred away.
	 */
	public transferCall(callId: string, to: SignalingActor, params: { requestedBy?: string } = {}): ServerCallRecord | null {
		const call = this.getCall(callId);
		if (!call || call.state === 'hangup') {
			return null;
		}

		const requestedBy = params.requestedBy || call.callerContractId;
		const staysOnCall = requestedBy === call.calleeContractId ? call.callee : call.caller;

		const replacement = this.createCall({
			caller: staysOnCall,
			callee: to,
			callerContractId: requestedBy,
			callerFeatures: this.callerFeatures.get(call.callId),
			replacingCallId: call.callId,
			transferredBy: this.contactFor(staysOnCall),
		});

		this.endCall(call, 'transfer');

		return replacement;
	}

	private async handleClientSignal(userId: string, signal: ClientMediaSignal): Promise<void> {
		this.receivedSignals.push(signal);
		this.options.logger?.debug('FakeSignalingServer.received', signal);

		if (this.options.validateSignals !== false && !isClientMediaSignal(signal)) {
			throw new Error(`A client sent a signal the package's own schema rejects: ${JSON.stringify(signal)}`);
		}

		if (this.options.dropSignals?.includes(signal.type)) {
			return undefined;
		}

		switch (signal.type) {
			case 'register':
				return this.onRegister(userId, signal.contractId, signal.oldContractId, signal.requestSignals);
			case 'request-call':
				return this.onRequestCall(
					userId,
					signal.contractId,
					signal.callId,
					signal.callee,
					signal.supportedServices,
					signal.supportedFeatures,
				);
			case 'answer':
				return this.onAnswer(userId, signal.contractId, signal.callId, signal.answer, signal.supportedFeatures);
			case 'hangup':
				return this.onHangup(signal.callId, signal.reason);
			case 'local-sdp':
				return this.onLocalSdp(signal.callId, signal.contractId, signal.sdp, signal.negotiationId, signal.streams);
			case 'negotiation-needed':
				return this.onNegotiationNeeded(signal.callId, signal.contractId);
			case 'local-state':
				return this.onLocalState(signal);
			case 'error':
				return this.onError(signal.callId, Boolean(signal.critical));
			case 'transfer':
				this.transferCall(signal.callId, signal.to, { requestedBy: signal.contractId });
				return undefined;
			case 'dtmf':
				return undefined;
		}
	}

	private onRegister(userId: string, contractId: string, oldContractId?: string, requestSignals?: boolean): void {
		const session = this.sessions.get(contractId);
		if (!session) {
			return;
		}

		session.registered = true;

		if (oldContractId) {
			this.migrateContract(oldContractId, contractId);
		}

		const calls = this.callsForUser(userId).filter((call) => call.state !== 'hangup');

		this.deliver(contractId, {
			type: 'registered',
			toContractId: contractId,
			calls: calls.map(({ callId }) => callId),
			activeCalls: calls.filter(({ state }) => state === 'accepted' || state === 'active').map(({ callId }) => callId),
		});

		if (!requestSignals) {
			return;
		}

		// A re-synced session needs the notifications that moved the call forward, not just its creation
		for (const call of calls) {
			this.deliverNewCall(call, contractId, userId);

			if (call.state !== 'accepted' && call.state !== 'active') {
				continue;
			}

			this.deliver(contractId, {
				type: 'notification',
				callId: call.callId,
				notification: 'accepted',
				signedContractId: userId === call.caller.id ? call.callerContractId : call.calleeContractId || contractId,
				features: call.features,
			});

			if (call.state === 'active') {
				this.deliver(contractId, { type: 'notification', callId: call.callId, notification: 'active' });
			}
		}
	}

	private onRequestCall(
		userId: string,
		contractId: string,
		requestedCallId: string,
		callee: SignalingActor,
		supportedServices: CallService[],
		supportedFeatures?: CallFeature[],
	): void {
		const reject = (reason: CallRejectedReason) =>
			this.deliver(contractId, { type: 'rejected-call-request', callId: requestedCallId, toContractId: contractId, reason });

		const queuedRejection = this.pendingRejections.shift();
		if (queuedRejection) {
			return reject(queuedRejection);
		}

		if (!supportedServices.includes('webrtc')) {
			return reject('unsupported');
		}

		if (this.options.rejectWhenCallerIsBusy !== false && this.callsForUser(userId).some(({ state }) => state !== 'hangup')) {
			return reject('busy');
		}

		if (callee.type === 'user' && !this.registeredSessionsForUser(callee.id).length) {
			return reject('unavailable');
		}

		this.createCall({
			caller: { type: 'user', id: userId },
			callee,
			callerContractId: contractId,
			requestedCallId,
			callerFeatures: supportedFeatures,
		});
	}

	private onAnswer(userId: string, contractId: string, callId: string, answer: string, supportedFeatures?: CallFeature[]): void {
		const call = this.getCall(callId);
		if (!call || call.state === 'hangup') {
			return;
		}

		if (answer === 'ack') {
			return;
		}

		if (answer === 'unavailable') {
			call.unavailableContracts.add(contractId);

			const calleeSessions = this.registeredSessionsForUser(call.callee.id);
			if (calleeSessions.length && calleeSessions.every(({ contractId: id }) => call.unavailableContracts.has(id))) {
				this.endCall(call, 'unavailable');
			}
			return;
		}

		if (answer === 'reject') {
			this.endCall(call, 'rejected');
			return;
		}

		if (answer !== 'accept' || userId !== call.callee.id) {
			return;
		}

		if (call.calleeContractId && call.calleeContractId !== contractId) {
			return;
		}

		call.calleeContractId = contractId;
		call.state = 'accepted';
		call.features = intersectFeatures(this.options.features || ALL_FEATURES, this.callerFeatures.get(call.callId), supportedFeatures);

		// Each actor has its own contract, so every session hears which of its actor's contracts was signed
		this.broadcast(call, (recipient) => ({
			type: 'notification',
			callId: call.callId,
			notification: 'accepted',
			signedContractId: recipient.userId === call.caller.id ? call.callerContractId : contractId,
			features: call.features,
		}));

		this.requestOffer(call, call.callerContractId);
	}

	private onHangup(callId: string, reason: CallHangupReason): void {
		const call = this.getCall(callId);
		if (!call || call.state === 'hangup') {
			return;
		}

		this.endCall(call, reason === 'another-client' ? 'normal' : reason);
	}

	private onLocalSdp(
		callId: string,
		contractId: string,
		sdp: RTCSessionDescriptionInit,
		negotiationId: string,
		streams?: { tag: string; id: string }[],
	): void {
		const call = this.getCall(callId);
		if (!call || call.state === 'hangup') {
			return;
		}

		const target = this.otherContract(call, contractId);
		if (!target) {
			return;
		}

		this.deliver(target, {
			type: 'remote-sdp',
			callId: call.callId,
			toContractId: target,
			sdp,
			negotiationId,
			...(streams && { streams }),
		});
	}

	private onNegotiationNeeded(callId: string, contractId: string): void {
		const call = this.getCall(callId);
		if (!call || call.state === 'hangup') {
			return;
		}

		this.requestOffer(call, contractId);
	}

	private onLocalState(signal: ClientMediaSignalLocalState): void {
		const byCall = this.reportedStates.get(signal.contractId) || new Map<string, ClientMediaSignalLocalState>();
		byCall.set(signal.callId, signal);
		this.reportedStates.set(signal.contractId, byCall);

		const call = this.getCall(signal.callId);
		if (!call || call.state !== 'accepted' || signal.clientState !== 'active') {
			return;
		}

		call.state = 'active';
		this.broadcast(call, { type: 'notification', callId: call.callId, notification: 'active' });
	}

	private onError(callId: string, critical: boolean): void {
		const call = this.getCall(callId);
		if (!call || call.state === 'hangup' || !critical) {
			return;
		}

		this.endCall(call, 'service-error');
	}

	private createCall(params: {
		caller: SignalingActor;
		callee: SignalingActor;
		callerContractId: string;
		requestedCallId?: string;
		callerFeatures?: CallFeature[];
		replacingCallId?: string;
		transferredBy?: CallContact;
	}): ServerCallRecord {
		this.callCount++;

		const call: ServerCallRecord = {
			callId: `server-call-${this.callCount}`,
			requestedCallId: params.requestedCallId || null,
			service: 'webrtc',
			caller: params.caller,
			callee: params.callee,
			callerContractId: params.callerContractId,
			calleeContractId: null,
			state: 'ringing',
			features: [],
			flags: this.options.flags || [],
			hangupReason: null,
			negotiationCount: 0,
			unavailableContracts: new Set(),
			...(params.replacingCallId && { replacingCallId: params.replacingCallId }),
			...(params.transferredBy && { transferredBy: params.transferredBy }),
		};

		this.calls.set(call.callId, call);
		this.callerFeatures.set(call.callId, params.callerFeatures || ALL_FEATURES);

		this.deliverNewCall(call, call.callerContractId, call.caller.id);

		for (const session of this.registeredSessionsForUser(call.callee.id)) {
			this.deliverNewCall(call, session.contractId, call.callee.id);
		}

		return call;
	}

	private deliverNewCall(call: ServerCallRecord, contractId: string, userId: string): void {
		const isCaller = userId === call.caller.id;
		const self = isCaller ? call.caller : call.callee;
		const contact = isCaller ? call.callee : call.caller;
		const signedContractId = isCaller ? call.callerContractId : call.calleeContractId;

		this.deliver(contractId, {
			type: 'new',
			callId: call.callId,
			service: call.service,
			kind: 'direct',
			role: isCaller ? 'caller' : 'callee',
			self: { ...this.contactFor(self), ...(signedContractId === contractId && { contractId }) },
			contact: this.contactFor(contact),
			...(isCaller && call.requestedCallId && { requestedCallId: call.requestedCallId }),
			...(call.replacingCallId && { replacingCallId: call.replacingCallId }),
			...(call.transferredBy && { transferredBy: call.transferredBy }),
			...(call.flags.length && { flags: call.flags }),
		});
	}

	private requestOffer(call: ServerCallRecord, contractId: string): string {
		call.negotiationCount++;
		const negotiationId = `${call.callId}-neg-${call.negotiationCount}`;

		this.deliver(contractId, { type: 'request-offer', callId: call.callId, toContractId: contractId, negotiationId });

		return negotiationId;
	}

	private endCall(call: ServerCallRecord, reason: CallHangupReason): void {
		call.state = 'hangup';
		call.hangupReason = reason;

		this.broadcast(call, { type: 'notification', callId: call.callId, notification: 'hangup', hangupReason: reason });
	}

	private broadcast(call: ServerCallRecord, signal: ServerMediaSignal | ((recipient: ServerSession) => ServerMediaSignal)): void {
		const userIds = new Set([call.caller, call.callee].filter(({ type }) => type === 'user').map(({ id }) => id));

		for (const userId of userIds) {
			for (const session of this.registeredSessionsForUser(userId)) {
				this.deliver(session.contractId, typeof signal === 'function' ? signal(session) : signal);
			}
		}
	}

	private deliver(contractId: string, signal: ServerMediaSignal): void {
		this.queue.push(async () => {
			const session = this.sessions.get(contractId);
			if (!session) {
				return;
			}

			this.options.logger?.debug('FakeSignalingServer.deliver', contractId, signal);
			await session.session.processSignal(signal);
		});
	}

	private otherContract(call: ServerCallRecord, contractId: string): string | null {
		if (contractId === call.callerContractId) {
			return call.calleeContractId;
		}
		if (contractId === call.calleeContractId) {
			return call.callerContractId;
		}

		return null;
	}

	private migrateContract(oldContractId: string, contractId: string): void {
		for (const call of this.calls.values()) {
			if (call.callerContractId === oldContractId) {
				call.callerContractId = contractId;
			}
			if (call.calleeContractId === oldContractId) {
				call.calleeContractId = contractId;
			}
		}
	}

	private registeredSessionsForUser(userId: string): ServerSession[] {
		return [...this.sessions.values()].filter((session) => session.userId === userId && session.registered);
	}

	private contactFor(actor: SignalingActor): CallContact {
		return { type: actor.type, id: actor.id, ...this.userInfo.get(actor.id) };
	}
}
