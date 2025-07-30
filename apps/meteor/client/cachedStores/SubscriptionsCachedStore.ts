import type { IOmnichannelRoom, IRoomWithRetentionPolicy, ISubscription } from '@rocket.chat/core-typings';
import { DEFAULT_SLA_CONFIG, LivechatPriorityWeight } from '@rocket.chat/core-typings';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';

import { RoomsCachedStore } from './RoomsCachedStore';
import { PrivateCachedStore } from '../lib/cachedCollections/CachedCollection';
import { createDocumentMapStore } from '../lib/cachedCollections/DocumentMapStore';

declare module '@rocket.chat/core-typings' {
	interface ISubscription {
		lowerCaseName: string;
		lowerCaseFName: string;
	}
}

class SubscriptionsCachedStore extends PrivateCachedStore<SubscriptionWithRoom, ISubscription> {
	constructor() {
		super({
			name: 'subscriptions',
			eventType: 'notify-user',
			store: createDocumentMapStore(),
		});
	}

	protected override mapRecord(subscription: ISubscription): SubscriptionWithRoom {
		const room = RoomsCachedStore.store.getState().find((r) => r._id === subscription.rid);

		const lastRoomUpdate = room?.lm || subscription.ts || room?.ts;

		return {
			...subscription,
			...(() => {
				const { name } = subscription;
				const fname = subscription.fname || name;
				return {
					lowerCaseName: String(!subscription.prid ? name : fname).toLowerCase(),
					lowerCaseFName: String(fname).toLowerCase(),
				};
			})(),
			encrypted: room?.encrypted,
			description: room?.description,
			cl: room?.cl,
			topic: room?.topic,
			announcement: room?.announcement,
			broadcast: room?.broadcast,
			archived: room?.archived,
			avatarETag: room?.avatarETag,
			retention: (room as IRoomWithRetentionPolicy | undefined)?.retention,
			lastMessage: room?.lastMessage,
			teamId: room?.teamId,
			teamMain: room?.teamMain,
			uids: room?.uids,
			usernames: room?.usernames,
			usersCount: room?.usersCount ?? 0,
			v: (room as IOmnichannelRoom | undefined)?.v,
			transcriptRequest: (room as IOmnichannelRoom | undefined)?.transcriptRequest,
			servedBy: (room as IOmnichannelRoom | undefined)?.servedBy,
			onHold: (room as IOmnichannelRoom | undefined)?.onHold,
			tags: (room as IOmnichannelRoom | undefined)?.tags,
			closedAt: (room as IOmnichannelRoom | undefined)?.closedAt,
			metrics: (room as IOmnichannelRoom | undefined)?.metrics,
			muted: room?.muted,
			waitingResponse: (room as IOmnichannelRoom | undefined)?.waitingResponse,
			responseBy: (room as IOmnichannelRoom | undefined)?.responseBy,
			priorityId: (room as IOmnichannelRoom | undefined)?.priorityId,
			slaId: (room as IOmnichannelRoom | undefined)?.slaId,
			priorityWeight: (room as IOmnichannelRoom | undefined)?.priorityWeight || LivechatPriorityWeight.NOT_SPECIFIED,
			estimatedWaitingTimeQueue:
				(room as IOmnichannelRoom | undefined)?.estimatedWaitingTimeQueue || DEFAULT_SLA_CONFIG.ESTIMATED_WAITING_TIME_QUEUE,
			livechatData: (room as IOmnichannelRoom | undefined)?.livechatData,
			departmentId: (room as IOmnichannelRoom | undefined)?.departmentId,
			ts: room?.ts ?? subscription.ts,
			source: (room as IOmnichannelRoom | undefined)?.source,
			queuedAt: (room as IOmnichannelRoom | undefined)?.queuedAt,
			federated: room?.federated,
			lm: subscription.lr ? new Date(Math.max(subscription.lr.getTime(), lastRoomUpdate?.getTime() || 0)) : lastRoomUpdate,
		};
	}

	async upsertSubscription(record: ISubscription): Promise<void> {
		return this.handleRecordEvent('changed', record);
	}

	protected deserializeFromCache(record: unknown) {
		const deserialized = super.deserializeFromCache(record);

		if (deserialized?.lastMessage?._updatedAt) {
			deserialized.lastMessage._updatedAt = new Date(deserialized.lastMessage._updatedAt);
		}

		return deserialized;
	}
}

const instance = new SubscriptionsCachedStore();

export {
	/** @deprecated new code refer to Minimongo collections like this one; prefer fetching data from the REST API, listening to changes via streamer events, and storing the state in a Tanstack Query */
	instance as SubscriptionsCachedStore,
};
