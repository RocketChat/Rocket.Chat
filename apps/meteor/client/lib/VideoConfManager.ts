import type { IRoom, IUser, VideoConferenceInstructions } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { Notifications } from '../../app/notifications/client';
import { APIClient } from '../../app/utils/client';
import { tryAssignmentAsync } from '../../lib/utils/tryAssignment';
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

type DirectCallParams = {
	uid: IUser['_id'];
	rid: IRoom['_id'];
	callId: string;
};

type IncomingDirectCall = DirectCallParams & { timeout: number };

export const VideoConfManager = new (class VideoConfManager extends Emitter<{
	// We gave up on calling a remote user
	'direct/cancel': DirectCallParams;

	// A remote user is calling us
	'direct/ringing': DirectCallParams;

	// An incoming call was lost, either by timeout or because the remote user canceled
	'direct/lost': DirectCallParams;

	// We tried to accept an incoming call but the process failed
	'direct/failed': DirectCallParams;

	// A remote user accepted our call
	'direct/accepted': DirectCallParams;
}> {
	private userId: string | undefined;

	private currentCallHandler = 0;

	private currentCallId: string | undefined;

	private startingNewCall = false;

	private hooks: (() => void)[] = [];

	private mutedCalls: Set<string>;

	private incomingDirectCalls: Map<string, IncomingDirectCall>;

	private acceptingCallId: string | undefined;

	private acceptingCallTimeout = 0;

	constructor() {
		super();
		this.incomingDirectCalls = new Map<string, IncomingDirectCall>();
		this.mutedCalls = new Set<string>();
	}

	public isBusy(): boolean {
		if (this.startingNewCall) {
			return true;
		}

		if (this.currentCallHandler || this.currentCallId) {
			return true;
		}

		return false;
	}

	public isRinging(): boolean {
		return this.incomingDirectCalls.size > 0;
	}

	public async startCall(roomId: IRoom['_id']): Promise<void> {
		if (!this.userId || this.isBusy()) {
			throw new Error('Video manager is busy.');
		}

		debug && console.log(`[VideoConf] Starting new call on room ${roomId}`);
		this.startingNewCall = true;

		const data = await tryAssignmentAsync<VideoConferenceInstructions>(
			async () => (await APIClient.v1.post('video-conference.start', {}, { roomId })).data,
			(e) => {
				debug && console.error(`[VideoConf] Failed to start new call on room ${roomId}`);
				this.startingNewCall = false;
				throw e;
			},
		);

		switch (data.type) {
			case 'direct':
				this.startingNewCall = false;
				return this.callUser({ uid: data.callee, rid: roomId, callId: data.callId });
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
		this.muteIncomingCall(callId);

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

			this.emit('direct/failed', { callId, uid: callData.uid, rid: callData.rid });
		}, ACCEPT_TIMEOUT) as unknown as number;

		debug && console.log(`[VideoConf] Notifying user ${callData.uid} that we accept their call.`);
		Notifications.notifyUser(callData.uid, 'video-conference.accepted', { callId, uid: this.userId, rid: callData.rid });
	}

	public muteIncomingCall(callId: string): void {
		// Muting will stop a callId from ringing, but it doesn't affect any part of the existing workflow

		this.mutedCalls.add(callId);
		// Remove it from the muted list once enough time has passed
		setTimeout(() => this.mutedCalls.delete(callId), CALL_TIMEOUT * 20);
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

	private joinDirectCall(params: DirectCallParams): void {
		debug && console.log(`[VideoConf] Opening a call with ${params.uid}.`);
		// #ToDo Join the call
	}

	private async callUser({ uid, rid, callId }: DirectCallParams): Promise<void> {
		if (this.currentCallHandler || this.currentCallId) {
			throw new Error('Video Conference State Error.');
		}

		let attempt = 1;
		this.currentCallId = callId;
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
		}, CALL_INTERVAL) as unknown as number;

		debug && console.log(`[VideoConf] Ringing user ${uid} for the first time.`);
		Notifications.notifyUser(uid, 'video-conference.call', { uid: this.userId, rid, callId });
	}

	private async giveUp({ uid, rid, callId }: DirectCallParams): Promise<void> {
		debug && console.log(`[VideoConf] Stop ringing user ${uid}.`);
		if (this.currentCallHandler) {
			clearInterval(this.currentCallHandler);
			this.currentCallHandler = 0;
			this.currentCallId = undefined;
		}

		debug && console.log(`[VideoConf] Notifying user ${uid} that we are no longer calling.`);
		Notifications.notifyUser(uid, 'video-conference.canceled', { uid: this.userId, rid, callId });
		this.emit('direct/cancel', { uid, rid, callId });
	}

	private disconnect(): void {
		debug && console.log(`[VideoConf] disconnecting user ${this.userId}`);
		for (const hook of this.hooks) {
			hook();
		}
		this.hooks = [];

		if (this.currentCallHandler) {
			clearInterval(this.currentCallHandler);
			this.currentCallHandler = 0;
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
		this.currentCallId = undefined;
		this.acceptingCallId = undefined;
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

		debug && console.log(`[VideoConf] Call ${callId} from ${lostCall.uid} was lost.`);
		this.emit('direct/lost', { callId, uid: lostCall.uid, rid: lostCall.rid });
	}

	private createAbortTimeout(callId: string): number {
		return setTimeout(() => this.abortIncomingCall(callId), CALL_TIMEOUT) as unknown as number;
	}

	private startNewIncomingCall({ callId, uid, rid }: DirectCallParams): void {
		if (this.mutedCalls.has(callId)) {
			debug && console.log(`[VideoConf] Ignoring muted call.`);
			return;
		}

		debug && console.log(`[VideoConf] Storing this new call information.`);
		this.incomingDirectCalls.set(callId, {
			callId,
			uid,
			rid,
			timeout: this.createAbortTimeout(callId),
		});

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

		if (!this.mutedCalls.has(callId)) {
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
		if (params.callId !== this.currentCallId) {
			debug && console.log(`[VideoConf] User ${params.uid} has accepted a call ${params.callId} from us, but we're not calling.`);
			return;
		}

		debug && console.log(`[VideoConf] User ${params.uid} has accepted our call ${params.callId}.`);

		// Stop ringing
		if (this.currentCallHandler) {
			clearInterval(this.currentCallHandler);
			this.currentCallHandler = 0;
		}

		this.joinDirectCall(params);
		this.emit('direct/accepted', params);

		// #ToDo: As joining is not yet implemented, we're clearing the state instead
		this.currentCallId = undefined;
	}
})();

Meteor.startup(() => Tracker.autorun(() => VideoConfManager.updateUser()));
