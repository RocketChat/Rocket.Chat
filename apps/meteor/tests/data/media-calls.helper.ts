import { randomUUID } from 'crypto';

import type { Credentials } from '@rocket.chat/api-client';
import type { IMediaCall, IUser } from '@rocket.chat/core-typings';
import { DDPSDK } from '@rocket.chat/ddp-client';
import type {
	CallFeature,
	CallHangupReason,
	ClientMediaSignal,
	ServerMediaSignal,
	ServerMediaSignalNewCall,
	ServerMediaSignalNotification,
	ServerMediaSignalRegistered,
	ServerMediaSignalRejectedCallRequest,
} from '@rocket.chat/media-signaling';
import { callFeatureList } from '@rocket.chat/media-signaling';

import { api, apiUrl, request } from './api-data';

/** How long a signal the server owes this client is waited for before the wait is called a failure. */
const SIGNAL_TIMEOUT = 20_000;

/** Every feature a browser client offers; the workspace narrows it to the ones it allows. */
const CLIENT_SUPPORTED_FEATURES: CallFeature[] = [...callFeatureList];

type SignalMatch<TSignal extends ServerMediaSignal> = (signal: ServerMediaSignal) => signal is TSignal;

type WaitForSignalOptions = {
	/** The index `mark()` returned before the action being waited on, so an older signal never matches. */
	from: number;
	/** Named in the error a timeout throws, as "Timed out waiting for <description>". */
	description: string;
	timeout?: number;
};

/** Thrown when the server refuses to place a call a client asked for. */
export class CallRequestRejectedError extends Error {
	constructor(public readonly signal: ServerMediaSignalRejectedCallRequest) {
		super(`The server refused to place the call: ${signal.reason}`);
	}
}

/**
 * One user's media call client, standing in for a browser tab.
 *
 * It holds the signaling session the server signs contracts against: a websocket it sends client
 * signals over and reads server signals from, plus the `contractId` that identifies the session in
 * both directions. Every call a test drives goes through one of these per participant, so the
 * workspace runs the same code path a real client would drive - no browser and no WebRTC stack.
 */
export class MediaCallClient {
	/** Every signal the server has sent this client, oldest first. */
	private readonly received: ServerMediaSignal[] = [];

	private readonly waiters = new Set<(signal: ServerMediaSignal) => void>();

	private stopStream: () => void = () => undefined;

	private constructor(
		private readonly sdk: DDPSDK,
		readonly userId: IUser['_id'],
		readonly contractId: string,
		private readonly credentials: Credentials,
	) {}

	/**
	 * Connects a client for a user and waits until the server acknowledges it.
	 *
	 * Resolving means both directions are live: the registration this sends travelled up, and the
	 * acknowledgement it waits for travelled back down the subscription. A call placed after this
	 * can no longer be lost to a subscription that was not ready yet.
	 */
	static async open(credentials: Credentials): Promise<MediaCallClient> {
		const sdk = await DDPSDK.createAndConnect(apiUrl);

		await sdk.account.loginWithToken(credentials['X-Auth-Token']);

		const userId = credentials['X-User-Id'];
		const client = new MediaCallClient(sdk, userId, randomUUID(), credentials);

		const subscription = sdk.stream('notify-user', `${userId}/media-signal`, (signal) => client.receive(signal));

		await subscription.ready();
		client.stopStream = subscription.stop;

		await client.register();

		return client;
	}

	/** The number of signals already received, to wait only on what an action brings after it. */
	mark(): number {
		return this.received.length;
	}

	/** Every signal received since `from`, for a test that has to prove a signal never arrived. */
	signalsSince(from: number): ServerMediaSignal[] {
		return this.received.slice(from);
	}

	async waitForSignal<TSignal extends ServerMediaSignal>(
		match: SignalMatch<TSignal>,
		{ from, description, timeout = SIGNAL_TIMEOUT }: WaitForSignalOptions,
	): Promise<TSignal> {
		const alreadyReceived = this.received.slice(from).find(match);

		if (alreadyReceived) {
			return alreadyReceived;
		}

		return new Promise<TSignal>((resolve, reject) => {
			let timer: NodeJS.Timeout | undefined;

			const notify = (signal: ServerMediaSignal): void => {
				if (!match(signal)) {
					return;
				}

				clearTimeout(timer);
				this.waiters.delete(notify);
				resolve(signal);
			};

			timer = setTimeout(() => {
				this.waiters.delete(notify);
				reject(new Error(`Timed out waiting for ${description}`));
			}, timeout);

			this.waiters.add(notify);
		});
	}

	/**
	 * Asks the server to place a call, and returns whatever it answered with.
	 *
	 * Both answers are results a test may be after: the call the server created, or its refusal -
	 * which is the only thing a caller whose call an app prevented ever hears back.
	 */
	async requestCall(
		calleeId: IUser['_id'],
		{ features = CLIENT_SUPPORTED_FEATURES }: { features?: CallFeature[] } = {},
	): Promise<ServerMediaSignalNewCall | ServerMediaSignalRejectedCallRequest> {
		// The server assigns the real id and echoes this one back on the call it created, which is
		// what tells this request's answer apart from an unrelated call reaching the same client.
		const requestedCallId = `call-request-${randomUUID()}`;
		const from = this.mark();

		await this.send({
			type: 'request-call',
			callId: requestedCallId,
			contractId: this.contractId,
			callee: { type: 'user', id: calleeId },
			supportedServices: ['webrtc'],
			supportedFeatures: features,
		});

		return this.waitForSignal(
			(signal): signal is ServerMediaSignalNewCall | ServerMediaSignalRejectedCallRequest =>
				(signal.type === 'new' && signal.requestedCallId === requestedCallId) ||
				(signal.type === 'rejected-call-request' && signal.callId === requestedCallId),
			{ from, description: 'the server to answer the call this client requested' },
		);
	}

	/** Places a call that is meant to go through, and returns its id. */
	async placeCall(calleeId: IUser['_id'], options?: { features?: CallFeature[] }): Promise<IMediaCall['_id']> {
		const signal = await this.requestCall(calleeId, options);

		if (signal.type === 'rejected-call-request') {
			throw new CallRequestRejectedError(signal);
		}

		return signal.callId;
	}

	/** Waits for this client to be rung, and returns the id of the call ringing it. */
	async waitForIncomingCall(from: number): Promise<IMediaCall['_id']> {
		const newCall = await this.waitForSignal(
			(signal): signal is ServerMediaSignalNewCall => signal.type === 'new' && signal.role === 'callee',
			{ from, description: 'an incoming call' },
		);

		return newCall.callId;
	}

	/** Waits for a state notification about a call, such as the `active` one activation broadcasts. */
	async waitForNotification(
		callId: IMediaCall['_id'],
		notification: ServerMediaSignalNotification['notification'],
		from: number,
	): Promise<ServerMediaSignalNotification> {
		return this.waitForSignal(
			(signal): signal is ServerMediaSignalNotification =>
				signal.type === 'notification' && signal.callId === callId && signal.notification === notification,
			{ from, description: `the "${notification}" notification for call ${callId}` },
		);
	}

	/** Reports the user is reachable, which is what starts the callee's device ringing. */
	async acknowledgeCall(callId: IMediaCall['_id']): Promise<IMediaCall> {
		return this.answerCall(callId, 'ack');
	}

	async acceptCall(callId: IMediaCall['_id'], features: CallFeature[] = CLIENT_SUPPORTED_FEATURES): Promise<IMediaCall> {
		return this.answerCall(callId, 'accept', features);
	}

	async rejectCall(callId: IMediaCall['_id']): Promise<IMediaCall> {
		return this.answerCall(callId, 'reject');
	}

	/**
	 * Reports the media connection is up, which is what flags the call active.
	 *
	 * A browser sends this once WebRTC reaches the connected state. Nothing on the server reads the
	 * media itself, so a client with no WebRTC stack reports the same state and the call activates.
	 */
	async reportCallActive(callId: IMediaCall['_id']): Promise<void> {
		return this.send({
			type: 'local-state',
			callId,
			contractId: this.contractId,
			callState: 'active',
			clientState: 'active',
			contractState: 'signed',
		});
	}

	async hangupCall(callId: IMediaCall['_id'], reason: CallHangupReason = 'normal'): Promise<void> {
		return this.send({ type: 'hangup', callId, contractId: this.contractId, reason });
	}

	async close(): Promise<void> {
		this.stopStream();
		// The heartbeat and timeout timers outlive `connection.close()`, and a mocha run that ends
		// with them pending waits them out before the process exits.
		this.sdk.timeoutControl.stop();
		this.sdk.connection.close();
	}

	/**
	 * Answers a ringing call over REST rather than over the websocket.
	 *
	 * The endpoint exists for clients that want the server to confirm the answer took, and a test
	 * wants exactly that: a signal the server skipped is reported as an error here, where over the
	 * websocket it would be dropped silently and only show up as a later assertion timing out.
	 */
	private async answerCall(callId: IMediaCall['_id'], answer: 'ack' | 'accept' | 'reject', supportedFeatures?: CallFeature[]) {
		const response = await request
			.post(api('media-calls.answer'))
			.set(this.credentials)
			.send({ callId, contractId: this.contractId, answer, ...(supportedFeatures && { supportedFeatures }) })
			.expect(200);

		return response.body.call as IMediaCall;
	}

	private async register(): Promise<void> {
		const from = this.mark();

		await this.send({ type: 'register', contractId: this.contractId, requestSignals: false });

		await this.waitForSignal(
			(signal): signal is ServerMediaSignalRegistered => signal.type === 'registered' && signal.toContractId === this.contractId,
			{ from, description: 'the server to acknowledge this client' },
		);
	}

	private async send(signal: ClientMediaSignal): Promise<void> {
		await this.sdk.client.callAsync('stream-notify-user', `${this.userId}/media-calls`, JSON.stringify(signal));
	}

	private receive(signal: ServerMediaSignal): void {
		this.received.push(signal);

		for (const notify of [...this.waiters]) {
			notify(signal);
		}
	}
}

/** Places a call and leaves it ringing, with the callee's device reached. */
export const placeRingingCall = async (caller: MediaCallClient, callee: MediaCallClient): Promise<IMediaCall['_id']> => {
	const from = callee.mark();
	const callId = await caller.placeCall(callee.userId);

	await callee.waitForIncomingCall(from);
	await callee.acknowledgeCall(callId);

	return callId;
};

/**
 * Places a call, has the callee answer it, and returns once the call is active.
 *
 * Activation is what the caller's `active` notification reports, so a call this resolves for has
 * already reached the state the post-start app event fires from.
 */
export const placeAndAnswerCall = async (caller: MediaCallClient, callee: MediaCallClient): Promise<IMediaCall['_id']> => {
	const activeSince = caller.mark();
	const callId = await placeRingingCall(caller, callee);

	await callee.acceptCall(callId);
	await callee.reportCallActive(callId);
	await caller.waitForNotification(callId, 'active', activeSince);

	return callId;
};
