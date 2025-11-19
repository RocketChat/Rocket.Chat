import { api, ServiceClassInternal, type IMediaCallService, Authorization } from '@rocket.chat/core-services';
import type { IMediaCall, IUser, IRoom, IInternalMediaCallHistoryItem, CallHistoryItemState } from '@rocket.chat/core-typings';
import { Logger } from '@rocket.chat/logger';
import { callServer, type IMediaCallServerSettings } from '@rocket.chat/media-calls';
import { isClientMediaSignal, type ClientMediaSignal, type ServerMediaSignal } from '@rocket.chat/media-signaling';
import type { InsertionModel } from '@rocket.chat/model-typings';
import { CallHistory, MediaCalls, Rooms, Users } from '@rocket.chat/models';

import { getHistoryMessagePayload } from './getHistoryMessagePayload';
import { sendMessage } from '../../../app/lib/server/functions/sendMessage';
import { settings } from '../../../app/settings/server';
import { createDirectMessage } from '../../methods/createDirectMessage';

const logger = new Logger('media-call service');

export class MediaCallService extends ServiceClassInternal implements IMediaCallService {
	protected name = 'media-call';

	constructor() {
		super();
		callServer.emitter.on('signalRequest', ({ toUid, signal }) => this.sendSignal(toUid, signal));
		callServer.emitter.on('callUpdated', (params) => api.broadcast('media-call.updated', params));
		callServer.emitter.on('historyUpdate', ({ callId }) => setImmediate(() => this.saveCallToHistory(callId)));
		this.onEvent('media-call.updated', (params) => callServer.receiveCallUpdate(params));

		this.onEvent('watch.settings', async ({ setting }): Promise<void> => {
			if (setting._id.startsWith('VoIP_TeamCollab_')) {
				setImmediate(() => this.configureMediaCallServer());
			}
		});

		this.configureMediaCallServer();
	}

	public async processSignal(uid: IUser['_id'], signal: ClientMediaSignal): Promise<void> {
		try {
			logger.debug({ msg: 'new client signal', type: signal.type, uid });
			callServer.receiveSignal(uid, signal);
		} catch (error) {
			logger.error({ msg: 'failed to process client signal', error, signal, uid });
		}
	}

	public async processSerializedSignal(uid: IUser['_id'], signal: string): Promise<void> {
		try {
			logger.debug({ msg: 'new client signal', uid });

			const deserialized = await this.deserializeClientSignal(signal);

			callServer.receiveSignal(uid, deserialized);
		} catch (error) {
			logger.error({ msg: 'failed to process client signal', error, uid });
		}
	}

	public async hangupExpiredCalls(): Promise<void> {
		await callServer.hangupExpiredCalls().catch((error) => {
			logger.error({ msg: 'Media Call Server failed to hangup expired calls', error });
		});

		try {
			if (await MediaCalls.hasUnfinishedCalls()) {
				callServer.scheduleExpirationCheck();
			}
		} catch (error) {
			logger.error({ msg: 'Media Call Server failed to check if there are expired calls', error });
		}
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
			return;
		}

		return this.saveInternalCallToHistory(call);
	}

	private async saveInternalCallToHistory(call: IMediaCall): Promise<void> {
		if (call.caller.type !== 'user' || call.callee.type !== 'user') {
			logger.warn({ msg: 'Attempt to save an internal call history with a call that is not internal', callId: call._id });
			return;
		}

		const rid = await this.getRoomIdForInternalCall(call).catch((error) => {
			logger.error({ msg: 'Failed to determine room id for Internal Call', error });
			return undefined;
		});
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

		await Promise.allSettled([
			CallHistory.insertOne({
				...sharedData,
				uid: call.caller.id,
				direction: 'outbound',
				contactId: call.callee.id,
			}).catch((error: unknown) => logger.error({ msg: 'Failed to insert item into Call History', error })),
			CallHistory.insertOne({
				...sharedData,
				uid: call.callee.id,
				direction: 'inbound',
				contactId: call.caller.id,
			}).catch((error: unknown) => logger.error({ msg: 'Failed to insert item into Call History', error })),
		]);

		if (rid) {
			return this.sendHistoryMessage(call, rid);
		}
	}

	private async sendHistoryMessage(call: IMediaCall, rid: IRoom['_id']): Promise<void> {
		const room = await Rooms.findOneById(rid);
		if (!room) {
			return;
		}

		const userId = call.caller.id || call.createdBy?.id; // I think this should always be the caller, since during a transfer the createdBy contact is the one that transferred the call

		const user = await Users.findOneById(userId);
		if (!user) {
			return;
		}

		const state = this.getCallHistoryItemState(call);
		const duration = this.getCallDuration(call);

		const record = getHistoryMessagePayload(state, duration);

		try {
			const message = await sendMessage(user, record, room, false);

			if ('_id' in message) {
				await CallHistory.updateMany({ callId: call._id }, { $set: { messageId: message._id } });
				return;
			}
			throw new Error('Failed to save message id in history');
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to send history message';
			logger.error({ msg: errorMessage, error, callId: call._id });
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
		if (call.transferredBy) {
			return 'transferred';
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

	private async getRoomIdForInternalCall(call: IMediaCall): Promise<IRoom['_id']> {
		const room = await Rooms.findOneDirectRoomContainingAllUserIDs(call.uids, { projection: { _id: 1 } });
		if (room) {
			return room._id;
		}

		const requesterId = call.createdBy.type === 'user' && call.createdBy.id;
		const callerId = call.caller.type === 'user' && call.caller.id;

		const dmCreatorId = requesterId || callerId || call.uids[0];

		const usernames = (await Users.findByIds(call.uids, { projection: { username: 1 } }).toArray())
			.map(({ username }) => username)
			.filter((username) => username);

		if (usernames.length !== 2) {
			throw new Error('Invalid usernames for DM.');
		}

		const dmCreatorIsPartOfTheCall = call.uids.includes(dmCreatorId);

		const newRoom = await createDirectMessage(usernames, dmCreatorId, !dmCreatorIsPartOfTheCall); // If the dm creator is not part of the call, we need to exclude him from the new DM
		return newRoom.rid;
	}

	private async sendSignal(toUid: IUser['_id'], signal: ServerMediaSignal): Promise<void> {
		void api.broadcast('user.media-signal', { userId: toUid, signal });
	}

	private configureMediaCallServer(): void {
		callServer.configure(this.getMediaServerSettings());
	}

	private getMediaServerSettings(): IMediaCallServerSettings {
		const enabled = settings.get<boolean>('VoIP_TeamCollab_Enabled') ?? false;
		const sipEnabled = enabled && (settings.get<boolean>('VoIP_TeamCollab_SIP_Integration_Enabled') ?? false);
		const forceSip = sipEnabled && (settings.get<boolean>('VoIP_TeamCollab_SIP_Integration_For_Internal_Calls') ?? false);

		return {
			enabled,
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
			permissionCheck: (uid, callType) => this.userHasMediaCallPermission(uid, callType),
		};
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
		} catch (error) {
			logger.error({ msg: 'Failed to parse client signal' }, error);
			throw error;
		}
	}
}
