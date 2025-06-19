import type { IOmnichannelRoom, IRoom, IRoomWithRetentionPolicy } from '@rocket.chat/core-typings';
import { DEFAULT_SLA_CONFIG, LivechatPriorityWeight } from '@rocket.chat/core-typings';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';

import { CachedChatSubscription } from './CachedChatSubscription';
import { PrivateCachedCollection } from '../../../../client/lib/cachedCollections/CachedCollection';

class CachedChatRoom extends PrivateCachedCollection<IRoom> {
	constructor() {
		super({
			name: 'rooms',
			eventType: 'notify-user',
		});
	}

	private merge(room: IRoom, sub: SubscriptionWithRoom): SubscriptionWithRoom {
		return {
			...sub,
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
			ts: room.ts ?? sub.ts,
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
			lm: (sub.lm?.getTime() ?? -1) < (room.lm?.getTime() ?? -1) ? room.lm : sub.lm,
		};
	}

	protected override handleLoadedFromServer(rooms: IRoom[]): void {
		const indexedSubscriptions = CachedChatSubscription.collection.state.indexBy('rid');

		const subscriptionsWithRoom = rooms.flatMap((room) => {
			const sub = indexedSubscriptions.get(room._id);

			if (!sub) return [];

			return this.merge(room, sub);
		});

		CachedChatSubscription.collection.state.storeMany(subscriptionsWithRoom);
	}

	protected override async handleRecordEvent(action: 'removed' | 'changed', room: IRoom) {
		await super.handleRecordEvent(action, room);

		if (action === 'removed') return;

		CachedChatSubscription.collection.state.update(
			(record) => record.rid === room._id,
			(sub) => this.merge(room, sub),
		);
	}

	protected override handleSyncEvent(action: 'removed' | 'changed', room: IRoom): void {
		if (action === 'removed') return;

		CachedChatSubscription.collection.state.update(
			(record) => record.rid === room._id,
			(sub) => this.merge(room, sub),
		);
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
	/** @deprecated new code refer to Minimongo collections like this one; prefer fetching data from the REST API, listening to changes via streamer events, and storing the state in a Tanstack Query */
	instance as CachedChatRoom,
};
