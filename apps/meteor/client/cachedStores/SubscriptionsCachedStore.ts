import type { IOmnichannelRoom, IRoom, IRoomWithRetentionPolicy, ISubscription } from '@rocket.chat/core-typings';
import { DEFAULT_SLA_CONFIG, isRoomNativeFederated, LivechatPriorityWeight } from '@rocket.chat/core-typings';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';

import { PrivateCachedStore } from '../lib/cachedStores/CachedStore';
import { Rooms, Subscriptions } from '../stores';
import { isOptimized } from './config';

class SubscriptionsCachedStore extends PrivateCachedStore<SubscriptionWithRoom, ISubscription> {
	constructor() {
		super({
			name: 'subscriptions',
			eventType: 'notify-user',
			store: Subscriptions.use,
		});
	}

	/**
	 * Lower performance implementation that scans all rooms to find the one with the matching ID.
	 * See {@link SubscriptionCachedStoreOptimized} for the improved version.
	 */
	protected getRoomById(rid: ISubscription['rid']): IRoom | undefined {
		return Rooms.use.getState().find((r) => r._id === rid);
	}

	protected override mapRecord(subscription: ISubscription): SubscriptionWithRoom {
		const room = this.getRoomById(subscription.rid);

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

			...(room &&
				isRoomNativeFederated(room) && {
					federation: room.federation,
				}),

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

/**
 * Optimization: use O(1) map access instead of linear scan over all rooms.
 * Rooms store implements get(_id) via DocumentMapStore; previously we called find which looped all records.
 * For large room lists (thousands), replacing find with get reduces per-subscription mapping cost.
 */
class SubscriptionCachedStoreOptimized extends SubscriptionsCachedStore {
	protected override getRoomById(rid: ISubscription['rid']): IRoom | undefined {
		return Rooms.use.getState().get(rid);
	}
}

const instance = isOptimized ? new SubscriptionCachedStoreOptimized() : new SubscriptionsCachedStore();

export { instance as SubscriptionsCachedStore };
