import type { IOmnichannelRoom, IRoom, IRoomWithRetentionPolicy } from '@rocket.chat/core-typings';
import { DEFAULT_SLA_CONFIG, LivechatPriorityWeight } from '@rocket.chat/core-typings';

import { ChatSubscription } from './ChatSubscription';
import { CachedCollection } from '../../../ui-cached-collection/client';

class CachedChatRoom extends CachedCollection<IRoom> {
	constructor() {
		super({ name: 'rooms', noInit: true });
	}

	protected handleLoadFromServer(record: IRoom) {
		return this.mergeWithSubscription(record);
	}

	protected handleReceived(record: IRoom) {
		return this.mergeWithSubscription(record);
	}

	protected handleSync(record: IRoom) {
		return this.mergeWithSubscription(record);
	}

	private mergeWithSubscription(room: IRoom): IRoom {
		const sub = ChatSubscription.findOne({ rid: room._id });
		if (!sub) {
			return room;
		}

		ChatSubscription.update(
			{
				rid: room._id,
			},
			{
				$set: {
					encrypted: room.encrypted,
					description: room.description,
					cl: room.cl,
					topic: room.topic,
					announcement: room.announcement,
					broadcast: room.broadcast,
					archived: room.archived,
					avatarETag: room.avatarETag,
					retention: (room as IRoomWithRetentionPolicy | undefined)?.retention,
					uids: room.uids,
					usernames: room.usernames,
					usersCount: room.usersCount,
					lastMessage: room.lastMessage,
					streamingOptions: room.streamingOptions,
					teamId: room.teamId,
					teamMain: room.teamMain,
					v: (room as IOmnichannelRoom | undefined)?.v,
					transcriptRequest: (room as IOmnichannelRoom | undefined)?.transcriptRequest,
					servedBy: (room as IOmnichannelRoom | undefined)?.servedBy,
					onHold: (room as IOmnichannelRoom | undefined)?.onHold,
					tags: (room as IOmnichannelRoom | undefined)?.tags,
					closedAt: (room as IOmnichannelRoom | undefined)?.closedAt,
					metrics: (room as IOmnichannelRoom | undefined)?.metrics,
					muted: room.muted,
					waitingResponse: (room as IOmnichannelRoom | undefined)?.waitingResponse,
					responseBy: (room as IOmnichannelRoom | undefined)?.responseBy,
					priorityId: (room as IOmnichannelRoom | undefined)?.priorityId,
					priorityWeight: (room as IOmnichannelRoom | undefined)?.priorityWeight || LivechatPriorityWeight.NOT_SPECIFIED,
					estimatedWaitingTimeQueue:
						(room as IOmnichannelRoom | undefined)?.estimatedWaitingTimeQueue || DEFAULT_SLA_CONFIG.ESTIMATED_WAITING_TIME_QUEUE,
					slaId: (room as IOmnichannelRoom | undefined)?.slaId,
					livechatData: (room as IOmnichannelRoom | undefined)?.livechatData,
					departmentId: (room as IOmnichannelRoom | undefined)?.departmentId,
					ts: room.ts,
					source: (room as IOmnichannelRoom | undefined)?.source,
					queuedAt: (room as IOmnichannelRoom | undefined)?.queuedAt,
					federated: room.federated,
					...(() => {
						const name = room.name || sub.name;
						const fname = room.fname || sub.fname || name;
						return {
							lowerCaseName: String(!room.prid ? name : fname).toLowerCase(),
							lowerCaseFName: String(fname).toLowerCase(),
						};
					})(),
				},
			},
		);

		ChatSubscription.update(
			{
				rid: room._id,
				lm: { $lt: room.lm },
			},
			{
				$set: {
					lm: room.lm,
				},
			},
		);

		return room;
	}

	protected deserializeFromCache(record: unknown) {
		const deserialized = super.deserializeFromCache(record);

		if (deserialized?.lastMessage?._updatedAt) {
			deserialized.lastMessage._updatedAt = new Date(deserialized.lastMessage._updatedAt);
		}

		return deserialized;
	}
}

const instance = new CachedChatRoom();

export {
	/** @deprecated */
	instance as CachedChatRoom,
};
