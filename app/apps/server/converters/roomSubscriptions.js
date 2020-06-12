import { Subscriptions } from '../../../models';
import { transformMappedData } from '../../lib/misc/transformMappedData';

export class AppRoomSubscriptionsConverter {
	constructor(orch) {
		this.orch = orch;
	}

	convertSubscriptionToAppById(subscriptionId) {
		return this.convertSubscriptionToApp(Subscriptions.findOneById(subscriptionId));
	}

	convertSubscriptionToApp(subscription) {
		if (!subscription) {
			return undefined;
		}

		const map = {
			id: '_id',
			hasAlert: 'alert',
			unreadCount: 'unread',
			userMentionsCount: 'userMentions',
			groupMentionsCount: 'groupMentions',
			createdAt: 'ts',
			updatedAt: '_updatedAt',
			lastSeenAt: 'ls',
			isHidden: (subscription) => {
				const result = !subscription.open;
				delete subscription.open;
				return result;
			},
			user: (subscription) => {
				const result = this.orch.getConverters().get('users').convertById(subscription.u._id);
				delete subscription.u;
				return result;
			},
			room: (subscription) => {
				const result = this.orch.getConverters().get('rooms').convertById(subscription.rid);
				delete subscription.rid;
				return result;
			},
		};

		return transformMappedData(subscription, map);
	}
}
