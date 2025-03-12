import type { CallPreferences, DirectCallData, DirectCallParams, IRoom, IUser, ProviderCapabilities } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';

import { getConfig } from './utils/getConfig';
import { sdk } from '../../app/utils/client/lib/SDKClient';

const debug = !!(getConfig('debug') || getConfig('debug-VideoConf'));

// The interval between attempts to call the remote user
const CALL_INTERVAL = 3000;
// How many attempts to call we're gonna make
const CALL_ATTEMPT_LIMIT = 10;
// The amount of time we'll assume an incoming call is still valid without any updates from the remote user
const CALL_TIMEOUT = 10000;
// How long are we gonna wait for a link after accepting an incoming call
const ACCEPT_TIMEOUT = 5000;

type IncomingDirectCall = DirectCallParams & {
	timeout: ReturnType<typeof setTimeout> | undefined;
	acceptTimeout?: ReturnType<typeof setTimeout> | undefined;
};

type CurrentCallParams = {
	callId: string;
	url: string;
	providerName?: string;
};

type VideoConfEvents = {
	// We gave up on calling a remote user or they rejected our call
	'direct/cancel': DirectCallParams;

	// A remote user is calling us
	'direct/ringing': DirectCallParams;

	// An incoming call was lost, either by timeout or because the remote user canceled
	'direct/lost': DirectCallParams;

	// We tried to accept an incoming call but the process failed
	'direct/failed': DirectCallParams;

	// A remote user accepted our call
	'direct/accepted': DirectCallParams;

	// We stopped calling a remote user
	'direct/stopped': DirectCallParams;

	'preference/changed': { key: keyof CallPreferences; value: boolean };

	// The list of incoming calls has changed in some way
	'incoming/changed': void;

	// The list of ringing incoming calls may have changed
	'ringing/changed': void;

	// The value of `isCalling` may have changed
	'calling/changed': void;

	'calling/ended': void;

	// When join call
	'call/join': CurrentCallParams;

	'error': { error: string };

	'capabilities/changed': void;
};

export const VideoConfManager = new (class VideoConfManager extends Emitter<VideoConfEvents> {
	private userId: string | undefined;

	private currentCallHandler: ReturnType<typeof setTimeout> | undefined;

	private currentCallData: (DirectCallParams & { joined?: boolean }) | undefined;

	private startingNewCall = false;

	private hooks: (() => void)[] = [];

	private incomingDirectCalls: Map<string, IncomingDirectCall>;

	private directCalls: DirectCallData[] = [];

	private dismissedCalls: Set<string>;

	private _preferences: CallPreferences;

	private _capabilities: ProviderCapabilities;

	private _logLevel: number;

	public get preferences(): CallPreferences {
		return this._preferences;
	}

	public get capabilities(): ProviderCapabilities {
		return this._capabilities;
	}

	constructor() {
		super();
		this._logLevel = 0;
		this.incomingDirectCalls = new Map<string, IncomingDirectCall>();
		this.dismissedCalls = new Set<string>();
		this._preferences = { mic: true, cam: false };
		this._capabilities = {};

		this.on('incoming/changed', () => {
			this.directCalls = [...this.incomingDirectCalls.values()]
				// Filter out any calls that we're in the process of accepting, so they're already hidden from the UI
				.filter((call) => !call.acceptTimeout)
				.map(({ timeout: _, acceptTimeout: _t, ...call }) => ({ ...call, dismissed: this.isCallDismissed(call.callId) }));
		});
	}

	public isBusy(): boolean {
		if (this.startingNewCall) {
			return true;
		}

		return this.isCalling();
	}

	public isRinging(): boolean {
		return [...this.incomingDirectCalls.values()].some(({ callId }) => !this.isCallDismissed(callId));
	}

	public isCalling(): boolean {
		if (this.currentCallHandler || (this.currentCallData && !this.currentCallData.joined)) {
			return true;
		}

		return false;
	}

	public getIncomingDirectCalls(): DirectCallData[] {
		return this.directCalls;
	}

	public async startCall(roomId: IRoom['_id'], title?: string): Promise<void> {
		if (!this.userId || this.isBusy()) {
			this.emitError('error-videoconf-cant-start-call-with-manager-busy');
			throw new Error('Video manager is busy.');
		}

		this.debugLog(`[VideoConf] Starting new call on room ${roomId}`);
		this.startingNewCall = true;
		this.emit('calling/changed');

		const { data } = await sdk.rest.post('/v1/video-conference.start', { roomId, title, allowRinging: true }).catch((e: any) => {
			console.error(`[VideoConf] Failed to start new call on room ${roomId}`, e);
			this.startingNewCall = false;
			this.emit('calling/changed');
			this.emitError(e?.xhr?.responseJSON?.error || 'error-videoconf-unexpected');

			return Promise.reject(e);
		});

		this.startingNewCall = false;
		this.emit('calling/changed');

		if (data.type !== 'direct') {
			this.emit('calling/ended');
		}

		switch (data.type) {
			case 'direct':
				return this.callUser({ uid: data.calleeId, rid: roomId, callId: data.callId });
			case 'videoconference':
				return this.joinCall(data.callId);
			case 'livechat':
				return this.joinCall(data.callId);
		}
	}

	public acceptIncomingCall(callId: string): void {
		const callData = this.incomingDirectCalls.get(callId);
		if (!callData) {
			this.emitError();
			throw new Error('Unable to find accepted call information.');
		}
		if (callData.acceptTimeout) {
			this.debugLog(`[VideoConf] We're already trying to accept call ${callId}.`);
			return;
		}

		this.debugLog(`[VideoConf] Accepting incoming call ${callId}.`);

		if (callData.timeout) {
			clearTimeout(callData.timeout);
			this.setIncomingCallAttribute(callId, 'timeout', undefined);
		}

		// Mute this call Id so any lingering notifications don't trigger it again
		this.dismissIncomingCall(callId);

		this.setIncomingCallAttribute(
			callId,
			'acceptTimeout',
			setTimeout(() => {
				const updatedCallData = this.incomingDirectCalls.get(callId);
				if (!updatedCallData?.acceptTimeout) {
					return;
				}

				this.debugLog(`[VideoConf] Attempt to accept call has timed out.`);
				this.removeIncomingCall(callId);

				this.emit('direct/failed', { callId, uid: callData.uid, rid: callData.rid });
				this.emitError('error-videoconf-direct-call-accept-timeout');
			}, ACCEPT_TIMEOUT),
		);
		this.emit('incoming/changed');

		this.debugLog(`[VideoConf] Notifying user ${callData.uid} that we accept their call.`);
		this.userId && this.notifyUser(callData.uid, 'accepted', { callId, uid: this.userId, rid: callData.rid });
	}

	public rejectIncomingCall(callId: string): void {
		this.dismissIncomingCall(callId);

		const callData = this.incomingDirectCalls.get(callId);
		if (!callData) {
			return;
		}

		this.userId && this.notifyUser(callData.uid, 'rejected', { callId, uid: this.userId, rid: callData.rid });
		this.loseIncomingCall(callId);
	}

	public dismissedIncomingCalls(): void {
		// Mute all calls that are currently ringing
		if ([...this.incomingDirectCalls.keys()].some((callId) => this.dismissedIncomingCallHelper(callId))) {
			this.emit('ringing/changed');
			this.emit('incoming/changed');
		}
	}

	public async loadCapabilities(): Promise<void> {
		const { capabilities } = await sdk.rest.get('/v1/video-conference.capabilities').catch((e: any) => {
			console.error(`[VideoConf] Failed to load video conference capabilities`, e);
			this.emitError();

			return Promise.reject(e);
		});

		this._capabilities = capabilities || {};
		this.emit('capabilities/changed');
	}

	private setIncomingCallAttribute<T extends keyof IncomingDirectCall>(
		callId: string,
		attributeName: T,
		value: IncomingDirectCall[T] | undefined,
	): void {
		const callData = this.incomingDirectCalls.get(callId);
		if (!callData) {
			console.error(`[VideoConf] Cannot change attribute "${attributeName}" of unknown call "${callId}".`);
			return;
		}

		const newData: IncomingDirectCall = {
			...callData,
		};

		if (value === undefined) {
			delete newData[attributeName];
		} else {
			newData[attributeName] = value;
		}

		this.debugLog(`[VideoConf] Updating attribute "${attributeName}" of call "${callId}".`);
		this.incomingDirectCalls.set(callId, newData);
	}

	private emitError(error = 'error-videoconf-unexpected'): void {
		this.emit('error', { error });
	}

	private dismissedIncomingCallHelper(callId: string): boolean {
		// Muting will stop a callId from ringing, but it doesn't affect any part of the existing workflow
		if (this.isCallDismissed(callId)) {
			return false;
		}

		this.debugLog(`[VideoConf] Dismissing call ${callId}`);
		this.dismissedCalls.add(callId);
		// We don't need to hold on to the dismissed callIds forever because the server won't let anyone call us with it for very long
		setTimeout(() => this.dismissedCalls.delete(callId), CALL_TIMEOUT * 20);
		// Only change the state if this call is actually in our list
		return this.incomingDirectCalls.has(callId);
	}

	public dismissIncomingCall(callId: string): boolean {
		if (this.dismissedIncomingCallHelper(callId)) {
			this.emit('ringing/changed');
			this.emit('incoming/changed');
			return true;
		}
		return false;
	}

	public updateUser(userId: string | null, isLoggingIn: boolean, isConnected: boolean): void {
		this.debugLog(`[VideoConf] Logged user or connection status has changed.`);

		if (this.userId) {
			this.disconnect(this.userId !== userId);
		}

		if (!isConnected || (userId && isLoggingIn)) {
			this.debugLog(`[VideoConf] Connection lost or login process still pending, skipping user change.`);
			return;
		}

		if (userId) {
			this.connectUser(userId);
		}
	}

	public changePreference(key: keyof CallPreferences, value: boolean): void {
		this._preferences[key] = value;
		this.emit('preference/changed', { key, value });
	}

	public setPreferences(prefs: Partial<CallPreferences>): void {
		for (const key in prefs) {
			if (prefs.hasOwnProperty(key)) {
				const prefKey = key as keyof CallPreferences;
				this.changePreference(prefKey, prefs[prefKey] as boolean);
			}
		}
	}

	public setLogLevel(level: number): void {
		this._logLevel = Math.max(0, Math.min(level, 2));
	}

	public async joinCall(callId: string): Promise<void> {
		this.debugLog(`[VideoConf] Joining call ${callId}.`);

		if (this.incomingDirectCalls.has(callId)) {
			const data = this.incomingDirectCalls.get(callId);
			if (data?.acceptTimeout) {
				this.debugLog('[VideoConf] Clearing acceptance timeout');
				clearTimeout(data.acceptTimeout);
			}
			this.removeIncomingCall(callId);
		}

		const params = {
			callId,
			state: {
				...(this._preferences.mic !== undefined ? { mic: this._preferences.mic } : {}),
				...(this._preferences.cam !== undefined ? { cam: this._preferences.cam } : {}),
			},
		};

		const { url, providerName } = await sdk.rest.post('/v1/video-conference.join', params).catch((e) => {
			console.error(`[VideoConf] Failed to join call ${callId}`, e);
			this.emitError(e?.xhr?.responseJSON?.error || 'error-videoconf-join-failed');

			return Promise.reject(e);
		});

		if (!url) {
			this.emitError('error-videoconf-missing-url');
			throw new Error('Failed to get video conference URL.');
		}

		this.debugLog(`[VideoConf] Opening ${url}.`);
		this.emit('call/join', { url, callId, providerName });
	}

	public abortCall(): void {
		if (!this.currentCallData) {
			return;
		}

		this.giveUp(this.currentCallData);
	}

	private infoLog(...args: any[]): void {
		(debug || this._logLevel >= 1) && console.log(...args);
	}

	private warnLog(...args: any[]): void {
		(debug || this._logLevel >= 1) && console.warn(...args);
	}

	private debugLog(...args: any[]): void {
		(debug || this._logLevel >= 2) && console.log(...args);
	}

	private rejectIncomingCallsFromUser(userId: string): void {
		for (const [, { callId, uid }] of this.incomingDirectCalls) {
			if (userId === uid) {
				this.debugLog(`[VideoConf] Rejecting old incoming call from user ${userId}`);
				this.rejectIncomingCall(callId);
			}
		}
	}

	private async callUser({ uid, rid, callId }: DirectCallParams): Promise<void> {
		if (this.currentCallHandler || this.currentCallData) {
			this.emitError('error-videoconf-cant-start-call-with-manager-busy');
			throw new Error('Video Conference State Error.');
		}

		let attempt = 1;
		this.currentCallData = { callId, rid, uid };
		this.currentCallHandler = setInterval(() => {
			if (!this.currentCallHandler) {
				this.warnLog(`[VideoConf] Ringing interval was not properly cleared.`);
				return;
			}

			attempt++;

			if (attempt > CALL_ATTEMPT_LIMIT) {
				this.giveUp({ uid, rid, callId });
				return;
			}

			this.debugLog(`[VideoConf] Ringing user ${uid}, attempt number ${attempt}.`);
			this.userId && this.notifyUser(uid, 'call', { uid: this.userId, rid, callId });
		}, CALL_INTERVAL);
		this.emit('calling/changed');

		this.debugLog(`[VideoConf] Ringing user ${uid} for the first time.`);
		this.userId && this.notifyUser(uid, 'call', { uid: this.userId, rid, callId });
	}

	private async giveUp({ uid, rid, callId }: DirectCallParams): Promise<void> {
		const joined = this.currentCallData?.joined;

		this.debugLog(`[VideoConf] Stop ringing user ${uid}.`);
		if (this.currentCallHandler) {
			clearInterval(this.currentCallHandler);
			this.currentCallHandler = undefined;
			this.currentCallData = undefined;
			this.emit('calling/changed');
		}

		this.debugLog(`[VideoConf] Notifying user ${uid} that we are no longer calling.`);
		this.userId && this.notifyUser(uid, 'canceled', { uid: this.userId, rid, callId });

		this.emit('direct/cancel', { uid, rid, callId });
		this.emit('direct/stopped', { uid, rid, callId });

		if (joined) {
			return;
		}

		sdk.rest.post('/v1/video-conference.cancel', { callId });
	}

	private disconnect(clearCalls = true): void {
		console.log(`[VideoConf] disconnecting user ${this.userId}`);
		for (const hook of this.hooks) {
			hook();
		}
		this.hooks = [];
		this.userId = undefined;

		if (!clearCalls) {
			return;
		}

		if (this.currentCallHandler) {
			clearInterval(this.currentCallHandler);
			this.currentCallHandler = undefined;
		}

		this.incomingDirectCalls.forEach((call) => {
			if (call.timeout) {
				clearTimeout(call.timeout);
			}
			if (call.acceptTimeout) {
				clearTimeout(call.acceptTimeout);
			}
		});
		this.incomingDirectCalls.clear();
		this.dismissedCalls.clear();
		this.currentCallData = undefined;
		this._preferences = {};
		this.emit('incoming/changed');
		this.emit('ringing/changed');
		this.emit('calling/changed');
	}

	private async onVideoConfNotification({ action, params }: { action: string; params: DirectCallParams }): Promise<void> {
		if (!action || typeof action !== 'string') {
			this.warnLog('[VideoConf] Invalid action received.', action, params);
			return;
		}
		if (!params || typeof params !== 'object' || !params.callId || !params.uid || !params.rid) {
			this.warnLog('[VideoConf] Invalid params received.', action, params);
			return;
		}

		switch (action) {
			case 'call':
				return this.onDirectCall(params);
			case 'canceled':
				return this.onDirectCallCanceled(params);
			case 'accepted':
				return this.onDirectCallAccepted(params);
			case 'rejected':
				return this.onDirectCallRejected(params);
			case 'confirmed':
				return this.onDirectCallConfirmed(params);
			case 'join':
				return this.onDirectCallJoined(params);
			case 'end':
				return this.onDirectCallEnded(params);
		}
	}

	private async notifyUser(uid: IUser['_id'], action: string, params: DirectCallParams): Promise<void> {
		return sdk.publish('notify-user', [`${uid}/video-conference`, { action, params }]);
	}

	private async connectUser(userId: string): Promise<void> {
		console.log(`[VideoConf] connecting user ${userId}`);
		this.userId = userId;

		const { stop, ready } = sdk.stream('notify-user', [`${userId}/video-conference`], (data) => this.onVideoConfNotification(data));

		await ready();

		this.hooks.push(stop);
	}

	private abortIncomingCall(callId: string): void {
		// If we just accepted this call, then ignore the timeout
		if (this.incomingDirectCalls.get(callId)?.acceptTimeout) {
			return;
		}

		this.infoLog(`[VideoConf] Canceling call ${callId} due to ringing timeout.`);
		this.loseIncomingCall(callId);
	}

	private loseIncomingCall(callId: string): void {
		const lostCall = this.incomingDirectCalls.get(callId);
		if (!lostCall) {
			this.warnLog(`[VideoConf] Unable to cancel ${callId} because we have no information about it.`);
			return;
		}

		this.removeIncomingCall(callId);

		this.debugLog(`[VideoConf] Call ${callId} from ${lostCall.uid} was lost.`);
		this.emit('direct/lost', { callId, uid: lostCall.uid, rid: lostCall.rid });
	}

	private removeIncomingCall(callId: string): void {
		this.debugLog(`[VideoConf] Removing call with id "${callId}" from Incoming Calls list.`);
		if (!this.incomingDirectCalls.has(callId)) {
			return;
		}

		const isRinging = this.isRinging();

		const callData = this.incomingDirectCalls.get(callId);
		if (callData?.timeout) {
			clearTimeout(callData.timeout);
		}

		this.incomingDirectCalls.delete(callId);
		this.emit('incoming/changed');

		if (isRinging !== this.isRinging()) {
			this.emit('ringing/changed');
		}
	}

	private createAbortTimeout(callId: string): ReturnType<typeof setTimeout> {
		return setTimeout(() => this.abortIncomingCall(callId), CALL_TIMEOUT);
	}

	private startNewIncomingCall({ callId, uid, rid }: DirectCallParams): void {
		if (this.isCallDismissed(callId)) {
			this.debugLog(`[VideoConf] Ignoring dismissed call.`);
			return;
		}

		// Reject any currently ringing call from the user before registering the new one.
		this.rejectIncomingCallsFromUser(uid);

		this.debugLog(`[VideoConf] Storing this new call information.`);
		this.incomingDirectCalls.set(callId, {
			callId,
			uid,
			rid,
			timeout: this.createAbortTimeout(callId),
		});

		this.emit('incoming/changed');
		this.emit('ringing/changed');
		this.emit('direct/ringing', { callId, uid, rid });
	}

	private refreshExistingIncomingCall({ callId, uid, rid }: DirectCallParams): void {
		const existingData = this.incomingDirectCalls.get(callId);
		if (!existingData) {
			throw new Error('Video Conference Manager State Error');
		}

		this.debugLog(`[VideoConf] Resetting call timeout.`);
		if (existingData.timeout) {
			clearTimeout(existingData.timeout);
		}
		existingData.timeout = this.createAbortTimeout(callId);

		if (!this.isCallDismissed(callId)) {
			this.emit('direct/ringing', { callId, uid, rid });
		}
	}

	private onDirectCall({ callId, uid, rid }: DirectCallParams): void {
		// If we already accepted this call, then don't ring again
		if (this.incomingDirectCalls.get(callId)?.acceptTimeout) {
			return;
		}

		this.infoLog(`[VideoConf] User ${uid} is ringing with call ${callId}.`);
		if (this.incomingDirectCalls.has(callId)) {
			this.refreshExistingIncomingCall({ callId, uid, rid });
		} else {
			this.startNewIncomingCall({ callId, uid, rid });
		}
	}

	private onDirectCallCanceled({ callId }: DirectCallParams): void {
		this.infoLog(`[VideoConf] Call ${callId} was canceled by the remote user.`);

		// We had just accepted this call, but the remote user hang up before they got the notification, so cancel our acceptance
		const callData = this.incomingDirectCalls.get(callId);
		if (callData?.acceptTimeout) {
			this.emitError('error-videoconf-direct-call-accept-canceled');
			clearTimeout(callData.acceptTimeout);
			this.setIncomingCallAttribute(callId, 'acceptTimeout', undefined);
		}

		this.loseIncomingCall(callId);
	}

	private onDirectCallAccepted(params: DirectCallParams, skipConfirmation = false): void {
		if (!params.callId || params.callId !== this.currentCallData?.callId) {
			this.debugLog(`[VideoConf] User ${params.uid} has accepted a call ${params.callId} from us, but we're not calling.`);
			return;
		}

		this.infoLog(`[VideoConf] User ${params.uid} has accepted our call ${params.callId}.`);

		// Stop ringing
		if (this.currentCallHandler) {
			clearInterval(this.currentCallHandler);
			this.currentCallHandler = undefined;
		}

		const callData = this.currentCallData;

		this.emit('direct/accepted', params);
		this.emit('direct/stopped', params);
		this.currentCallData = undefined;
		this.emit('calling/changed');

		if (!callData.joined) {
			this.joinCall(params.callId);
		}

		if (skipConfirmation) {
			return;
		}

		this.debugLog(`[VideoConf] Notifying user ${callData.uid} that they can join the call now.`);
		this.userId && this.notifyUser(callData.uid, 'confirmed', { callId: callData.callId, uid: this.userId, rid: callData.rid });
	}

	private onDirectCallConfirmed(params: DirectCallParams): void {
		if (!params.callId || !this.incomingDirectCalls.get(params.callId)?.acceptTimeout) {
			this.warnLog(`[VideoConf] User ${params.uid} confirmed we can join ${params.callId} but we aren't trying to join it.`);
			return;
		}

		this.joinCall(params.callId);
	}

	private onDirectCallJoined(params: DirectCallParams): void {
		if (!params.callId) {
			this.debugLog(`[VideoConf] Invalid 'video-conference.join' event received: ${params.callId}, ${params.uid}.`);
			return;
		}

		if (params.uid === this.userId) {
			if (this.currentCallData?.callId === params.callId) {
				this.debugLog(`[VideoConf] We joined our own call (${this.userId}) from somewhere else. Flagging the call appropriatelly.`);
				this.currentCallData.joined = true;
				this.emit('calling/changed');
				return;
			}

			if (this.incomingDirectCalls.has(params.callId)) {
				this.debugLog(`[VideoConf] We joined the call ${params.callId} from somewhere else. Dismissing it.`);
				this.dismissIncomingCall(params.callId);
				this.loseIncomingCall(params.callId);
			}
			return;
		}

		if (params.callId !== this.currentCallData?.callId) {
			this.debugLog(`[VideoConf] User ${params.uid} has joined the call ${params.callId}, but we aren't calling with that id.`);
			return;
		}

		this.infoLog(`[VideoConf] User ${params.uid} has joined a call we started ${params.callId}.`);
		this.onDirectCallAccepted(params, true);
	}

	private onDirectCallEnded(params: DirectCallParams): void {
		if (!params.callId) {
			this.debugLog(`[VideoConf] Invalid 'video-conference.end' event received: ${params.callId}, ${params.uid}.`);
			return;
		}

		const callData = this.incomingDirectCalls.get(params.callId);
		if (callData) {
			this.infoLog(`[VideoConf] Incoming call ended by the server: ${params.callId}.`);
			if (callData.acceptTimeout) {
				this.emitError('error-videoconf-direct-call-accept-ended');
				clearTimeout(callData.acceptTimeout);
				this.setIncomingCallAttribute(params.callId, 'acceptTimeout', undefined);
			}

			this.loseIncomingCall(params.callId);
			return;
		}

		if (this.currentCallData?.callId !== params.callId) {
			this.infoLog(`[VideoConf] Server sent a call ended event for a call we're not aware of: ${params.callId}.`);
			return;
		}

		this.infoLog(`[VideoConf] Outgoing call ended by the server: ${params.callId}.`);

		// Stop ringing
		this.currentCallData = undefined;
		if (this.currentCallHandler) {
			clearInterval(this.currentCallHandler);
			this.currentCallHandler = undefined;
			this.emit('calling/changed');
			this.emit('direct/stopped', params);
		}
	}

	private onDirectCallRejected(params: DirectCallParams): void {
		if (!params.callId || params.callId !== this.currentCallData?.callId) {
			this.infoLog(`[VideoConf] User ${params.uid} has rejected a call ${params.callId} from us, but we're not calling.`);
			return;
		}

		this.infoLog(`[VideoConf] User ${params.uid} has rejected our call ${params.callId}.`);

		// Stop ringing
		if (this.currentCallHandler) {
			clearInterval(this.currentCallHandler);
			this.currentCallHandler = undefined;
		}

		const { joined } = this.currentCallData;

		this.emit('direct/cancel', params);
		this.currentCallData = undefined;
		this.emit('direct/stopped', params);
		this.emit('calling/changed');

		if (!joined) {
			sdk.rest.post('/v1/video-conference.cancel', { callId: params.callId });
		}
	}

	private isCallDismissed(callId: string): boolean {
		return this.dismissedCalls.has(callId);
	}
})();
