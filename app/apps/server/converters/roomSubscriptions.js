import { Subscriptions } from '../../../models';

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

		let user;
		if (subscription.u && subscription.u._id) {
			user = this.orch.getConverters().get('users').convertById(subscription.u._id);
		}

		let room;
		if (subscription.rid) {
			room = this.orch.getConverters().get('rooms').convertById(subscription.rid);
		}

		return {
			id: subscription._id,
			room,
			user,
			isHidden: !subscription.open,
			hasAlert: subscription.alert,
			unreadCount: subscription.unread,
			userMentionsCount: subscription.userMentions,
			groupMentionsCount: subscription.groupMentions,
			createdAt: subscription.ts,
			updatedAt: subscription._updatedAt,
			lastSeenAt: subscription.ls,
		};
	}
}
