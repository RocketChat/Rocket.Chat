import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { Notifications } from '../../app/notifications/client';
import { APIClient } from '../../app/utils/client';
import { getConfig } from './utils/getConfig';

const debug = !!(getConfig('debug') || getConfig('debug-VideoConf'));

// The interval between attempts to call the remote user
const CALL_INTERVAL = 3000;
// How many attempts to call we're gonna make
const CALL_ATTEMPT_LIMIT = 10;
// The amount of time we'll assume an incoming call is still valid without any updates from the remote user
const CALL_TIMEOUT = 10000;
// How long are we gonna wait for a link after accepting an incoming call
const ACCEPT_TIMEOUT = 5000;

export type DirectCallParams = {
	uid: IUser['_id'];
	rid: IRoom['_id'];
	callId: string;
	dismissed?: boolean;
	// TODO: improve this, nowadays there is not possible check if the video call has finished, but ist a nice improvement
	// state: 'incoming' | 'outgoing' | 'connected' | 'disconnected' | 'dismissed';
};

type IncomingDirectCall = DirectCallParams & { timeout: number };

type CallPreferences = {
	mic?: boolean;
	cam?: boolean;
};

export type CurrentCallParams = {
	callId: string;
	url: string;
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

	// The value os `isCalling` may have changed
	'calling/changed': void;
	// When join call
	'call/join': CurrentCallParams;

	'join/error': { error: string };

	'start/error': { error: string };
};
export const VideoConfManager = new (class VideoConfManager extends Emitter<VideoConfEvents> {
	private userId: string | undefined;

	private currentCallHandler: ReturnType<typeof setTimeout> | undefined;

	private currentCallData: DirectCallParams | undefined;

	private startingNewCall = false;

	private hooks: (() => void)[] = [];

	private incomingDirectCalls: Map<string, IncomingDirectCall>;

	private acceptingCallId: string | undefined;

	private acceptingCallTimeout = 0;

	private _preferences: CallPreferences;

	public get preferences(): CallPreferences {
		return this._preferences;
	}

	constructor() {
		super();
		this.incomingDirectCalls = new Map<string, IncomingDirectCall>();
		// this.mutedCalls = new Set<string>();
		this._preferences = {};
	}

	public isBusy(): boolean {
		return this.isCalling();
	}

	public isRinging(): boolean {
		return ![...this.incomingDirectCalls.values()].every(({ dismissed }) => Boolean(dismissed));
	}

	public isCalling(): boolean {
		if (this.startingNewCall) {
			return true;
		}
		if (this.currentCallHandler || this.currentCallData) {
			return true;
		}

		return false;
	}

	public getIncomingDirectCalls(): DirectCallParams[] {
		return [...this.incomingDirectCalls.values()].map(({ timeout: _, ...call }) => ({ ...call }));
	}

	public async startCall(roomId: IRoom['_id'], title?: string): Promise<void> {
		if (!this.userId || this.isBusy()) {
			throw new Error('Video manager is busy.');
		}

		debug && console.log(`[VideoConf] Starting new call on room ${roomId}`);
		this.startingNewCall = true;
		this.emit('calling/changed');

		const { data } = await APIClient.post('/v1/video-conference.start', { roomId, title }).catch((e: any) => {
			debug && console.error(`[VideoConf] Failed to start new call on room ${roomId}`);
			this.startingNewCall = false;
			this.emit('calling/changed');
			this.emit('start/error', { error: e?.xhr?.responseJSON?.error || 'unknown-error' });

			return Promise.reject(e);
		});

		this.startingNewCall = false;
		this.emit('calling/changed');

		switch (data.type) {
			case 'direct':
				return this.callUser({ uid: data.callee, rid: roomId, callId: data.callId });
			case 'videoconference':
				return this.joinCall(data.callId);
			case 'livechat':
				return this.joinCall(data.callId);
		}
	}

	public acceptIncomingCall(callId: string): void {
		const callData = this.incomingDirectCalls.get(callId);
		if (!callData) {
			throw new Error('Unable to find accepted call information.');
		}

		debug && console.log(`[VideoConf] Accepting incoming call.`);

		if (callData.timeout) {
			clearTimeout(callData.timeout);
		}

		// Mute this call Id so any lingering notifications don't trigger it again
		this.dismissIncomingCall(callId);

		this.acceptingCallId = callId;
		this.acceptingCallTimeout = setTimeout(() => {
			if (this.acceptingCallId !== callId) {
				debug && console.warn(`[VideoConf] Accepting call timeout not properly cleared.`);
				return;
			}

			debug && console.log(`[VideoConf] Attempt to accept call has timed out.`);
			this.acceptingCallId = undefined;
			this.acceptingCallTimeout = 0;

			this.incomingDirectCalls.delete(callId);
			this.emit('incoming/changed');

			this.emit('direct/failed', { callId, uid: callData.uid, rid: callData.rid });
		}, ACCEPT_TIMEOUT) as unknown as number;

		debug && console.log(`[VideoConf] Notifying user ${callData.uid} that we accept their call.`);
		Notifications.notifyUser(callData.uid, 'video-conference.accepted', { callId, uid: this.userId, rid: callData.rid });

		this.joinCall(callId);
	}

	public rejectIncomingCall(callId: string): void {
		this.dismissIncomingCall(callId);

		const callData = this.incomingDirectCalls.get(callId);
		if (!callData) {
			return;
		}

		Notifications.notifyUser(callData.uid, 'video-conference.rejected', { callId, uid: this.userId, rid: callData.rid });
		this.loseIncomingCall(callId);
	}

	public dismissedIncomingCalls(): void {
		// Mute all calls that are currently ringing
		if ([...this.incomingDirectCalls.keys()].some((callId) => this.dismissedIncomingCallHelper(callId))) {
			this.emit('ringing/changed');
			this.emit('incoming/changed');
		}
	}

	private dismissedIncomingCallHelper(callId: string): boolean {
		// Muting will stop a callId from ringing, but it doesn't affect any part of the existing workflow
		const callData = this.incomingDirectCalls.get(callId);
		if (!callData) {
			return false;
		}
		this.incomingDirectCalls.set(callId, { ...callData, dismissed: true });
		setTimeout(() => {
			const callData = this.incomingDirectCalls.get(callId);

			if (!callData) {
				return;
			}
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { dismissed, ...rest } = callData;
			this.incomingDirectCalls.set(callId, { ...rest });
		}, CALL_TIMEOUT * 20);
		return true;
	}

	public dismissIncomingCall(callId: string): boolean {
		if (this.dismissedIncomingCallHelper(callId)) {
			this.emit('ringing/changed');
			this.emit('incoming/changed');
			return true;
		}
		return false;
	}

	public updateUser(): void {
		const userId = Meteor.userId();

		if (this.userId === userId) {
			debug && console.log(`[VideoConf] Logged user has not changed, so we're not changing the hooks.`);
			return;
		}

		debug && console.log(`[VideoConf] Logged user has changed.`);

		if (this.userId) {
			this.disconnect();
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

	public async joinCall(callId: string): Promise<void> {
		debug && console.log(`[VideoConf] Joining call ${callId}.`);

		const params = {
			callId,
			state: {
				...(this._preferences.mic !== undefined ? { mic: this._preferences.mic } : {}),
				...(this._preferences.cam !== undefined ? { cam: this._preferences.cam } : {}),
			},
		};

		const { url } = await APIClient.post('/v1/video-conference.join', params).catch((e) => {
			debug && console.error(`[VideoConf] Failed to join call ${callId}`);
			this.emit('join/error', { error: e?.xhr?.responseJSON?.error || 'unknown-error' });

			return Promise.reject(e);
		});

		debug && console.log(`[VideoConf] Opening ${url}.`);
		this.emit('call/join', { url, callId });
	}

	public abortCall(): void {
		if (!this.currentCallData) {
			return;
		}

		this.giveUp(this.currentCallData);
	}

	private async callUser({ uid, rid, callId }: DirectCallParams): Promise<void> {
		if (this.currentCallHandler || this.currentCallData) {
			throw new Error('Video Conference State Error.');
		}

		let attempt = 1;
		this.currentCallData = { callId, rid, uid };
		this.currentCallHandler = setInterval(() => {
			if (!this.currentCallHandler) {
				debug && console.warn(`[VideoConf] Ringing interval was not properly cleared.`);
				return;
			}

			attempt++;

			if (attempt > CALL_ATTEMPT_LIMIT) {
				this.giveUp({ uid, rid, callId });
				return;
			}

			debug && console.log(`[VideoConf] Ringing user ${uid}, attempt number ${attempt}.`);
			Notifications.notifyUser(uid, 'video-conference.call', { uid: this.userId, rid, callId });
		}, CALL_INTERVAL);
		this.emit('calling/changed');

		debug && console.log(`[VideoConf] Ringing user ${uid} for the first time.`);
		Notifications.notifyUser(uid, 'video-conference.call', { uid: this.userId, rid, callId });
	}

	private async giveUp({ uid, rid, callId }: DirectCallParams): Promise<void> {
		debug && console.log(`[VideoConf] Stop ringing user ${uid}.`);
		if (this.currentCallHandler) {
			clearInterval(this.currentCallHandler);
			this.currentCallHandler = undefined;
			this.currentCallData = undefined;
			this.emit('calling/changed');
		}

		debug && console.log(`[VideoConf] Notifying user ${uid} that we are no longer calling.`);
		Notifications.notifyUser(uid, 'video-conference.canceled', { uid: this.userId, rid, callId });

		this.emit('direct/cancel', { uid, rid, callId });
		this.emit('direct/stopped', { uid, rid, callId });

		APIClient.post('/v1/video-conference.cancel', { callId });
	}

	private disconnect(): void {
		debug && console.log(`[VideoConf] disconnecting user ${this.userId}`);
		for (const hook of this.hooks) {
			hook();
		}
		this.hooks = [];

		if (this.currentCallHandler) {
			clearInterval(this.currentCallHandler);
			this.currentCallHandler = undefined;
		}

		if (this.acceptingCallTimeout) {
			clearTimeout(this.acceptingCallTimeout);
			this.acceptingCallTimeout = 0;
		}

		this.incomingDirectCalls.forEach((call) => {
			if (call.timeout) {
				clearTimeout(call.timeout);
			}
		});
		this.incomingDirectCalls.clear();
		this.currentCallData = undefined;
		this.acceptingCallId = undefined;
		this._preferences = {};
		this.emit('incoming/changed');
		this.emit('ringing/changed');
		this.emit('calling/changed');
	}

	private async hookNotification(eventName: string, cb: (...params: any[]) => void): Promise<void> {
		this.hooks.push(await Notifications.onUser(eventName, cb));
	}

	private connectUser(userId: string): void {
		debug && console.log(`[VideoConf] connecting user ${userId}`);
		this.userId = userId;

		this.hookNotification('video-conference.call', (params: DirectCallParams) => this.onDirectCall(params));
		this.hookNotification('video-conference.canceled', (params: DirectCallParams) => this.onDirectCallCanceled(params));
		this.hookNotification('video-conference.accepted', (params: DirectCallParams) => this.onDirectCallAccepted(params));
		this.hookNotification('video-conference.rejected', (params: DirectCallParams) => this.onDirectCallRejected(params));
	}

	private abortIncomingCall(callId: string): void {
		// If we just accepted this call, then ignore the timeout
		if (this.acceptingCallId === callId) {
			return;
		}

		debug && console.log(`[VideoConf] Canceling call ${callId} due to ringing timeout.`);
		this.loseIncomingCall(callId);
	}

	private loseIncomingCall(callId: string): void {
		const lostCall = this.incomingDirectCalls.get(callId);
		if (!lostCall) {
			debug && console.warn(`[VideoConf] Unable to cancel ${callId} because we have no information about it.`);
			return;
		}

		if (lostCall.timeout) {
			clearTimeout(lostCall.timeout);
		}

		this.incomingDirectCalls.delete(callId);
		this.emit('incoming/changed');
		this.emit('ringing/changed');

		debug && console.log(`[VideoConf] Call ${callId} from ${lostCall.uid} was lost.`);
		this.emit('direct/lost', { callId, uid: lostCall.uid, rid: lostCall.rid });
	}

	private createAbortTimeout(callId: string): number {
		return setTimeout(() => this.abortIncomingCall(callId), CALL_TIMEOUT) as unknown as number;
	}

	private startNewIncomingCall({ callId, uid, rid }: DirectCallParams): void {
		if (this.isCallDismissed(callId)) {
			debug && console.log(`[VideoConf] Ignoring dismissed call.`);
			return;
		}

		debug && console.log(`[VideoConf] Storing this new call information.`);
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

		debug && console.log(`[VideoConf] Resetting call timeout.`);
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
		if (this.acceptingCallId === callId) {
			return;
		}

		debug && console.log(`[VideoConf] User ${uid} is ringing with call ${callId}.`);
		if (this.incomingDirectCalls.has(callId)) {
			this.refreshExistingIncomingCall({ callId, uid, rid });
		} else {
			this.startNewIncomingCall({ callId, uid, rid });
		}
	}

	private onDirectCallCanceled({ callId }: DirectCallParams): void {
		debug && console.log(`[VideoConf] Call ${callId} was canceled by the remote user.`);

		// We had just accepted this call, but the remote user hang up before they got the notification, so cancel our acceptance
		if (this.acceptingCallId === callId) {
			if (this.acceptingCallTimeout) {
				clearTimeout(this.acceptingCallTimeout);
			}
			this.acceptingCallTimeout = 0;
		}

		this.loseIncomingCall(callId);
	}

	private onDirectCallAccepted(params: DirectCallParams): void {
		if (!params.callId || params.callId !== this.currentCallData?.callId) {
			debug && console.log(`[VideoConf] User ${params.uid} has accepted a call ${params.callId} from us, but we're not calling.`);
			return;
		}

		debug && console.log(`[VideoConf] User ${params.uid} has accepted our call ${params.callId}.`);

		// Stop ringing
		if (this.currentCallHandler) {
			clearInterval(this.currentCallHandler);
			this.currentCallHandler = undefined;
		}

		this.emit('direct/accepted', params);
		this.emit('direct/stopped', params);
		this.currentCallData = undefined;
		this.emit('calling/changed');

		// Immediately open the call in a new tab
		this.joinCall(params.callId);
	}

	private onDirectCallRejected(params: DirectCallParams): void {
		if (!params.callId || params.callId !== this.currentCallData?.callId) {
			debug && console.log(`[VideoConf] User ${params.uid} has rejected a call ${params.callId} from us, but we're not calling.`);
			return;
		}

		debug && console.log(`[VideoConf] User ${params.uid} has rejected our call ${params.callId}.`);

		// Stop ringing
		if (this.currentCallHandler) {
			clearInterval(this.currentCallHandler);
			this.currentCallHandler = undefined;
		}

		this.emit('direct/cancel', params);
		this.emit('direct/stopped', params);
		this.currentCallData = undefined;
		this.emit('calling/changed');

		APIClient.post('/v1/video-conference.cancel', { callId: params.callId });
	}

	private isCallDismissed(callId: string): boolean {
		return Boolean(this.incomingDirectCalls.get(callId)?.dismissed);
	}
})();

Meteor.startup(() => Tracker.autorun(() => VideoConfManager.updateUser()));
