import type { IOmnichannelRoom, IRoomWithRetentionPolicy, ISubscription } from '@rocket.chat/core-typings';
import { DEFAULT_SLA_CONFIG, LivechatPriorityWeight } from '@rocket.chat/core-typings';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';

import { CachedCollection } from '../../../ui-cached-collection/client/models/CachedCollection';
import { CachedChatRoom } from './CachedChatRoom';

declare module '@rocket.chat/core-typings' {
	interface ISubscription {
		lowerCaseName: string;
		lowerCaseFName: string;
	}
}

class CachedChatSubscription extends CachedCollection<SubscriptionWithRoom, ISubscription> {
	constructor() {
		super({ name: 'subscriptions' });
	}

	protected handleLoadFromServer(record: ISubscription) {
		return this.mergeWithRoom(record);
	}

	protected handleReceived(record: ISubscription) {
		return this.mergeWithRoom(record);
	}

	protected handleSync(record: ISubscription) {
		return this.mergeWithRoom(record);
	}

	private mergeWithRoom(subscription: ISubscription): SubscriptionWithRoom {
		const options = {
			fields: {
				lm: 1,
				lastMessage: 1,
				uids: 1,
				usernames: 1,
				usersCount: 1,
				topic: 1,
				encrypted: 1,
				description: 1,
				announcement: 1,
				broadcast: 1,
				archived: 1,
				avatarETag: 1,
				retention: 1,
				teamId: 1,
				teamMain: 1,
				msgs: 1,
				onHold: 1,
				metrics: 1,
				muted: 1,
				servedBy: 1,
				ts: 1,
				waitingResponse: 1,
				v: 1,
				transcriptRequest: 1,
				tags: 1,
				closedAt: 1,
				responseBy: 1,
				priorityId: 1,
				priorityWeight: 1,
				slaId: 1,
				estimatedWaitingTimeQueue: 1,
				livechatData: 1,
				departmentId: 1,
				source: 1,
				queuedAt: 1,
				federated: 1,
			},
		};

		const room = CachedChatRoom.collection.findOne({ _id: subscription.rid }, options);

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

	protected deserializeFromCache(record: unknown) {
		const deserialized = super.deserializeFromCache(record);

		if (deserialized?.lastMessage?._updatedAt) {
			deserialized.lastMessage._updatedAt = new Date(deserialized.lastMessage._updatedAt);
		}

		return deserialized;
	}
}

const instance = new CachedChatSubscription();

export {
	/** @deprecated */
	instance as CachedChatSubscription,
};
