import { api, ServiceClassInternal, type IMediaCallService, Authorization } from '@rocket.chat/core-services';
import type {
	IMediaCall,
	IUser,
	IRoom,
	IInternalMediaCallHistoryItem,
	CallHistoryItemState,
	IExternalMediaCallHistoryItem,
} from '@rocket.chat/core-typings';
import { Logger } from '@rocket.chat/logger';
import { callServer, type IMediaCallServerSettings } from '@rocket.chat/media-calls';
import { isClientMediaSignal, type ClientMediaSignal, type ServerMediaSignal } from '@rocket.chat/media-signaling';
import type { InsertionModel } from '@rocket.chat/model-typings';
import { CallHistory, MediaCalls, Rooms, Users } from '@rocket.chat/models';
import { getHistoryMessagePayload } from '@rocket.chat/ui-voip/dist/ui-kit/getHistoryMessagePayload';

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
			callServer.receiveSignal(uid, signal);
		} catch (err) {
			logger.error({ msg: 'failed to process client signal', err, signal, uid });
		}
	}

	public async processSerializedSignal(uid: IUser['_id'], signal: string): Promise<void> {
		try {
			const deserialized = await this.deserializeClientSignal(signal);

			callServer.receiveSignal(uid, deserialized);
		} catch (err) {
			logger.error({ msg: 'failed to process client signal', err, uid });
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

		await CallHistory.insertMany([outboundHistoryItem, inboundHistoryItem]).catch((err: unknown) =>
			logger.error({ msg: 'Failed to insert items into Call History', err }),
		);

		if (room) {
			return this.sendHistoryMessage(call, room);
		}
	}

	private async sendHistoryMessage(call: IMediaCall, room: IRoom): Promise<void> {
		const userId = call.caller.id || call.createdBy?.id; // I think this should always be the caller, since during a transfer the createdBy contact is the one that transferred the call

		const user = await Users.findOneById(userId);
		if (!user) {
			return;
		}

		const state = this.getCallHistoryItemState(call);
		const duration = this.getCallDuration(call);

		const record = getHistoryMessagePayload(state, duration, call._id);

		try {
			const message = await sendMessage(user, record, room, false);

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

	private async getRoomIdForInternalCall(call: IMediaCall): Promise<IRoom> {
		const room = await Rooms.findOneDirectRoomContainingAllUserIDs(call.uids);
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

	private async sendSignal(toUid: IUser['_id'], signal: ServerMediaSignal): Promise<void> {
		void api.broadcast('user.media-signal', { userId: toUid, signal });
	}

	private configureMediaCallServer(): void {
		callServer.configure(this.getMediaServerSettings());
	}

	private getMediaServerSettings(): IMediaCallServerSettings {
		const sipEnabled = settings.get<boolean>('VoIP_TeamCollab_SIP_Integration_Enabled') ?? false;
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
		} catch (err) {
			logger.error({ msg: 'Failed to parse client signal', err });
			throw err;
		}
	}
}
