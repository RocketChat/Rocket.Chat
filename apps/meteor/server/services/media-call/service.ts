import { api, Presence, ServiceClassInternal, type IMediaCallService, Authorization } from '@rocket.chat/core-services';
import type {
	IMediaCall,
	IUser,
	IRoom,
	IInternalMediaCallHistoryItem,
	CallHistoryItemState,
	IExternalMediaCallHistoryItem,
} from '@rocket.chat/core-typings';
import { UserStatus } from '@rocket.chat/core-typings';
import { callServer, type IMediaCallServerSettings, getSignalsForExistingCall } from '@rocket.chat/media-calls';
import type {
	CallFeature,
	ClientMediaSignal,
	ServerMediaSignal,
	ServerMediaCallSignal,
	ClientMediaSignalAnswer,
} from '@rocket.chat/media-signaling';
import { isClientMediaSignal } from '@rocket.chat/media-signaling';
import type { InsertionModel } from '@rocket.chat/model-typings';
import { CallHistory, MediaCalls, Rooms, Users } from '@rocket.chat/models';
import { callStateToTranslationKey, getHistoryMessagePayload } from '@rocket.chat/ui-voip/dist/ui-kit/getHistoryMessagePayload';

import {
	notifyAppsOfMediaCallEnded,
	notifyAppsOfMediaCallParticipantJoined,
	notifyAppsOfMediaCallStarted,
	runPreMediaCallCreatedAppHook,
} from './appEvents';
import { logger } from './logger';
import { sendVoipPushNotification } from './push/sendVoipPushNotification';
import { i18n } from '../../lib/i18n';
import { sendMessage } from '../../lib/messages/sendMessage';
import { createDirectMessage } from '../../meteor-methods/messages/createDirectMessage';
import { settings } from '../../settings';

export class MediaCallService extends ServiceClassInternal implements IMediaCallService {
	protected name = 'media-call';

	constructor() {
		super();
		callServer.emitter.on('signalRequest', ({ toUid, signal }) => this.sendSignal(toUid, signal));
		callServer.emitter.on('callUpdated', (params) => api.broadcast('media-call.updated', params));
		callServer.emitter.on('callActivated', ({ call }) => this.setPresenceForUsers(call.uids, call._id));
		callServer.emitter.on('callEnded', ({ call }) => this.clearPresenceForUsers(call.uids, call._id));
		callServer.emitter.on('historyUpdate', ({ callId }) => setImmediate(() => this.saveCallToHistory(callId)));
		callServer.emitter.on('pushNotificationRequest', ({ callId, event }) => sendVoipPushNotification(callId, event));
		this.onEvent('media-call.updated', (params) => callServer.receiveCallUpdate(params));

		// Apps-Engine media call events
		callServer.emitter.on('callAccepted', ({ call }) => this.notifyApps(call, notifyAppsOfMediaCallParticipantJoined));
		callServer.emitter.on('callActivated', ({ call }) => this.notifyApps(call, notifyAppsOfMediaCallStarted));
		callServer.emitter.on('callEnded', ({ call }) => this.notifyApps(call, notifyAppsOfMediaCallEnded));
		callServer.setHooks({ onPreCallCreated: runPreMediaCallCreatedAppHook });

		this.onEvent('watch.settings', async ({ setting }): Promise<void> => {
			if (setting._id.startsWith('VoIP_TeamCollab_')) {
				setImmediate(() => this.configureMediaCallServer());
			}
		});

		this.configureMediaCallServer();
	}

	public async answerCall(uid: IUser['_id'], params: Omit<ClientMediaSignalAnswer, 'type'>): Promise<IMediaCall> {
		const { callId, answer } = params;

		const call = await MediaCalls.findOneByIdAndCallee<Pick<IMediaCall, '_id'>>(
			callId,
			{ type: 'user', id: uid },
			{ projection: { _id: 1 } },
		);
		if (!call) {
			throw new Error('not-found');
		}

		const signal: ClientMediaSignalAnswer = {
			type: 'answer',
			...params,
		};

		await callServer.receiveSignal(uid, signal, { throwIfSkipped: true });

		const updatedCall = await MediaCalls.findOneById(callId);
		if (!updatedCall) {
			throw new Error('internal-error');
		}

		switch (answer) {
			case 'ack':
				if (updatedCall.acceptedAt || updatedCall.ended) {
					throw new Error('invalid-call-state');
				}
				break;
			case 'reject':
				if (!updatedCall.ended || updatedCall.endedBy?.id !== uid) {
					throw new Error('invalid-call-state');
				}
				break;
			case 'accept':
				if (updatedCall.callee.contractId !== signal.contractId) {
					if (updatedCall.callee.contractId) {
						throw new Error('invalid-call-state');
					}
					throw new Error('internal-error');
				}
				break;
		}

		return updatedCall;
	}

	public async processSignal(uid: IUser['_id'], signal: ClientMediaSignal): Promise<void> {
		try {
			await callServer.receiveSignal(uid, signal);
		} catch (err) {
			logger.error({ msg: 'failed to process client signal', err, signal, uid });
		}
	}

	public async processSerializedSignal(uid: IUser['_id'], signal: string): Promise<void> {
		let signalType: string | null = null;

		try {
			const deserialized = await this.deserializeClientSignal(signal);
			signalType = deserialized.type;

			await callServer.receiveSignal(uid, deserialized);
		} catch (err) {
			logger.error({ msg: 'failed to process client signal', err, uid, type: signalType });
		}
	}

	public async hangupExpiredCalls(): Promise<void> {
		await callServer.hangupExpiredCalls().catch((err) => {
			logger.error({ msg: 'Media Call Server failed to hangup expired calls', err });
		});

		try {
			if (await MediaCalls.hasUnfinishedCalls()) {
				callServer.scheduleExpirationCheck();
			}
		} catch (err) {
			logger.error({ msg: 'Media Call Server failed to check if there are expired calls', err });
		}
	}

	public async getUserStateSignals(uid: IUser['_id'], contractId: string): Promise<ServerMediaCallSignal[]> {
		const calls = await MediaCalls.findAllNotOverByUid(uid).toArray();

		const signals: ServerMediaCallSignal[] = [];
		for (const call of calls) {
			const callSignals = await getSignalsForExistingCall(call, uid, contractId);
			signals.push(...callSignals);
		}

		return signals;
	}

	/**
	 * Apps observe calls, they don't take part in them: never let one delay or break call
	 * signaling. The event carries the call as it was when the event happened, so a notification
	 * that waits still describes the transition it belongs to.
	 *
	 * One call's events reach an app in the order they happened, and nothing here has to arrange
	 * that: `setImmediate` runs the notifications in the order they were queued, and a notification
	 * awaits nothing between here and the JSON-RPC request the app receives.
	 */
	private notifyApps(call: IMediaCall, notify: (call: IMediaCall) => Promise<void>): void {
		setImmediate(() => {
			notify(call).catch((err) => logger.error({ msg: 'Failed to notify apps about a media call event', err, callId: call._id }));
		});
	}

	private async saveCallToHistory(callId: IMediaCall['_id']): Promise<void> {
		logger.info({ msg: 'saving media call to history', callId });

		const call = await MediaCalls.findOneById(callId);
		if (!call) {
			logger.warn({ msg: 'Attempt to save an invalid call to history', callId });
			return;
		}
		if (!call.ended) {
			logger.warn({ msg: 'Attempt to save a pending call to history', callId });
			return;
		}

		if (call.uids.length !== 2) {
			return this.saveExternalCallToHistory(call);
		}

		return this.saveInternalCallToHistory(call);
	}

	private async saveExternalCallToHistory(call: IMediaCall): Promise<void> {
		const callerIsInternal = call.caller.type === 'user';
		const calleeIsInternal = call.callee.type === 'user';

		if (callerIsInternal && calleeIsInternal) {
			logger.warn({ msg: 'Attempt to save an external call history with a call that is not external', callId: call._id });
			return;
		}

		if (!callerIsInternal && !calleeIsInternal) {
			logger.warn({ msg: 'Attempt to save an external call history with an invalid call', callId: call._id });
			return;
		}

		const state = this.getCallHistoryItemState(call);
		const duration = this.getCallDuration(call);
		const direction = callerIsInternal ? 'outbound' : 'inbound';
		const uid = callerIsInternal ? call.caller.id : call.callee.id;
		const contact = callerIsInternal ? call.callee : call.caller;

		const contactExtension = contact.sipExtension || contact.id;

		const historyItem: InsertionModel<IExternalMediaCallHistoryItem> = {
			uid,
			ts: call.createdAt,
			callId: call._id,
			state,
			type: 'media-call',
			duration,
			endedAt: call.endedAt || new Date(),
			external: true,
			direction,
			contactExtension,
		};

		await CallHistory.insertOne(historyItem).catch((err: unknown) => logger.error({ msg: 'Failed to insert item into Call History', err }));
	}

	private getContactDataForInternalHistory(
		contact: IMediaCall['caller'] | IMediaCall['callee'],
	): Pick<IInternalMediaCallHistoryItem, 'contactId' | 'contactName' | 'contactUsername'> {
		return {
			contactId: contact.id,
			contactName: contact.displayName,
			contactUsername: contact.username,
		};
	}

	private async saveInternalCallToHistory(call: IMediaCall): Promise<void> {
		if (call.caller.type !== 'user' || call.callee.type !== 'user') {
			logger.warn({ msg: 'Attempt to save an internal call history with a call that is not internal', callId: call._id });
			return;
		}

		const room = await this.getRoomIdForInternalCall(call).catch((err) => {
			logger.error({ msg: 'Failed to determine room id for Internal Call', err });
			return undefined;
		});
		const { _id: rid } = room || {};
		const state = this.getCallHistoryItemState(call);
		const duration = this.getCallDuration(call);

		const sharedData: Omit<InsertionModel<IInternalMediaCallHistoryItem>, 'uid' | 'direction' | 'contactId'> = {
			ts: call.createdAt,
			callId: call._id,
			state,
			type: 'media-call',
			duration,
			endedAt: call.endedAt || new Date(),
			external: false,
			...(rid && { rid }),
		};

		const outboundHistoryItem = {
			...sharedData,
			uid: call.caller.id,
			direction: 'outbound',
			...this.getContactDataForInternalHistory(call.callee),
		} as const;

		const inboundHistoryItem = {
			...sharedData,
			uid: call.callee.id,
			direction: 'inbound',
			...this.getContactDataForInternalHistory(call.caller),
		} as const;

		// A prevented call leaves an entry for the caller only. The callee's device never rang and
		// they were never told, so nothing appears in their history (spec §3).
		const historyItems = call.preventedBy ? [outboundHistoryItem] : [outboundHistoryItem, inboundHistoryItem];

		await CallHistory.insertMany(historyItems).catch((err: unknown) =>
			logger.error({ msg: 'Failed to insert items into Call History', err }),
		);

		if (room) {
			return this.sendHistoryMessage(call, room);
		}
	}

	private getLanguageForUser(language?: string): string {
		return language || settings.get('Language') || 'en';
	}

	private async sendHistoryMessage(call: IMediaCall, room: IRoom): Promise<void> {
		const userId = call.caller.id || call.createdBy?.id; // I think this should always be the caller, since during a transfer the createdBy contact is the one that transferred the call

		const user = await Users.findOneById(userId);
		if (!user) {
			return;
		}

		const state = this.getCallHistoryItemState(call);
		const skipNotifications = state !== 'not-answered' || call.hangupReason === 'rejected';
		const i18nKey = callStateToTranslationKey(state).i18n?.key;

		const msg = i18nKey ? i18n.t(i18nKey, { lng: this.getLanguageForUser(user.language) }) : '';
		const duration = this.getCallDuration(call);

		const record = getHistoryMessagePayload({ state, duration, callId: call._id, msg, preventedBy: call.preventedBy });

		try {
			const message = await sendMessage(user, record, room, { skipNotifications });

			if ('_id' in message) {
				await CallHistory.updateMany({ callId: call._id }, { $set: { messageId: message._id } });
				return;
			}
			throw new Error('Failed to save message id in history');
		} catch (err) {
			logger.error({ msg: 'Failed to send history message', err, callId: call._id });
		}
	}

	private getCallDuration(call: IMediaCall): number {
		const { activatedAt, endedAt = new Date() } = call;
		if (!activatedAt) {
			return 0;
		}

		const diff = endedAt.valueOf() - activatedAt.valueOf();
		return Math.floor(diff / 1000);
	}

	private getCallHistoryItemState(call: IMediaCall): CallHistoryItemState {
		// An app refused the call before it existed. This wins over every other state: the call never
		// rang, so it can be neither transferred, answered nor failed.
		if (call.preventedBy) {
			return 'prevented';
		}

		if (call.transferredBy) {
			return 'transferred';
		}

		if (call.hangupReason === 'not-answered') {
			return 'not-answered';
		}

		if (call.hangupReason?.startsWith('timeout')) {
			return 'failed';
		}

		if (call.hangupReason?.includes('error')) {
			if (!call.activatedAt) {
				return 'failed';
			}

			return 'error';
		}

		if (!call.acceptedAt) {
			return 'not-answered';
		}

		if (!call.activatedAt) {
			return 'failed';
		}

		return 'ended';
	}

	private async getRoomIdForInternalCall(call: IMediaCall): Promise<IRoom> {
		const uniqueUids = [...new Set(call.uids)];

		const room = await Rooms.findOneDirectRoomContainingAllUserIDs(uniqueUids);
		if (room) {
			return room;
		}

		const requesterId = call.createdBy.type === 'user' && call.createdBy.id;
		const callerId = call.caller.type === 'user' && call.caller.id;

		const dmCreatorId = requesterId || callerId || call.uids[0];

		const usernames = (
			await Users.findByIds(call.uids, { projection: { username: 1 } })
				.map((user) => user.username)
				.toArray()
		).filter((username) => username);

		if (usernames.length !== 2) {
			throw new Error('Invalid usernames for DM.');
		}

		const dmCreatorIsPartOfTheCall = call.uids.includes(dmCreatorId);

		const newRoom = await createDirectMessage(usernames, dmCreatorId, !dmCreatorIsPartOfTheCall); // If the dm creator is not part of the call, we need to exclude him from the new DM
		return {
			...newRoom,
			_id: newRoom.rid,
		};
	}

	private async setPresenceForUsers(uids: IUser['_id'][], callId: IMediaCall['_id']): Promise<void> {
		const users = await Users.findByIds<Pick<IUser, '_id' | 'language'>>(uids, { projection: { language: 1 } }).toArray();
		const languageByUid = new Map(users.map((user) => [user._id, user.language]));

		await Promise.all(
			uids.map(async (uid) => {
				try {
					await Presence.setActiveState(uid, {
						statusDefault: UserStatus.BUSY,
						statusText: i18n.t('Presence_status_on_a_call', { lng: this.getLanguageForUser(languageByUid.get(uid)) }),
						statusSource: 'internal',
						statusId: callId,
					});
				} catch (err) {
					logger.error({ msg: 'Failed to set presence for user on call', uid, err });
				}
			}),
		);
	}

	private async clearPresenceForUsers(uids: IUser['_id'][], callId: IMediaCall['_id']): Promise<void> {
		// pass callId so only this call's claim is cleared, never another claim that took over
		await Promise.all(
			uids.map((uid) =>
				Presence.endActiveState(uid, callId).catch((err) =>
					logger.error({ msg: 'Failed to clear presence for user after call', uid, err }),
				),
			),
		);
	}

	private async sendSignal(toUid: IUser['_id'], signal: ServerMediaSignal): Promise<void> {
		void api.broadcast('user.media-signal', { userId: toUid, signal });
	}

	private configureMediaCallServer(): void {
		callServer.configure(this.getMediaServerSettings());
	}

	private getMediaServerSettings(): IMediaCallServerSettings {
		const sipEnabled = settings.get<boolean>('VoIP_TeamCollab_SIP_Integration_Enabled') ?? false;
		const mobileRinging = settings.get<boolean>('VoIP_TeamCollab_Mobile_Ringing_Enabled') ?? false;
		const forceSip = sipEnabled && (settings.get<boolean>('VoIP_TeamCollab_SIP_Integration_For_Internal_Calls') ?? false);

		return {
			internalCalls: {
				requireExtensions: forceSip,
				routeExternally: forceSip ? 'always' : 'never',
			},
			sip: {
				enabled: sipEnabled,
				drachtio: {
					host: settings.get<string>('VoIP_TeamCollab_Drachtio_Host') ?? '',
					port: settings.get<number>('VoIP_TeamCollab_Drachtio_Port') ?? 9022,
					secret: settings.get<string>('VoIP_TeamCollab_Drachtio_Password') ?? '',
				},
				sipServer: {
					host: settings.get<string>('VoIP_TeamCollab_SIP_Server_Host') ?? '',
					port: settings.get<number>('VoIP_TeamCollab_SIP_Server_Port') ?? 5060,
				},
			},
			mobileRinging,
			permissionCheck: (uid, callType) => this.userHasMediaCallPermission(uid, callType),
			isFeatureAvailableForUser: (uid, feature) => this.userHasFeaturePermission(uid, feature),
		};
	}

	private userHasFeaturePermission(_uid: IUser['_id'], feature: CallFeature): boolean {
		if (feature === 'audio') {
			return true;
		}

		if (feature === 'screen-share') {
			return settings.get<boolean>('VoIP_TeamCollab_Screen_Sharing_Enabled') ?? false;
		}

		return true;
	}

	private async userHasMediaCallPermission(uid: IUser['_id'], callType: 'internal' | 'external' | 'any'): Promise<boolean> {
		if (callType === 'any') {
			return Authorization.hasAtLeastOnePermission(uid, ['allow-internal-voice-calls', 'allow-external-voice-calls']);
		}

		const permissionId = `allow-${callType}-voice-calls`;

		return Authorization.hasPermission(uid, permissionId);
	}

	private async deserializeClientSignal(serialized: string): Promise<ClientMediaSignal> {
		try {
			const signal = JSON.parse(serialized);
			if (!isClientMediaSignal(signal)) {
				throw new Error('signal-format-invalid');
			}
			return signal;
		} catch (err) {
			logger.error({ msg: 'Failed to parse client signal', err });
			throw err;
		}
	}
}
