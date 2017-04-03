/**
 * Created by billtt on 03/04/2017.
 */

RocketChat.SubscriptionUtil = new (class SubscriptionUtil {
	constructor() {
	}

	/**
	 * Sort subscriptions by activity (lm property from Rooms)
	 */
	sortSubscriptionsByActivity(subscriptions) {
		subscriptions = subscriptions || [];
		for (let i=0; i<subscriptions.length; i++) {
			const subscription = subscriptions[i];
			const room = RocketChat.models.Rooms.findOne({_id: subscription.rid}, {fields: {lm: 1}});
			if (room) {
				subscription.lm = room.lm;
			}
		}
		subscriptions = _.sortBy(subscriptions, function(subscription) {
			if (subscription.lm) {
				return -subscription.lm.getTime();
			}
			return 0;
		});
		return subscriptions;
	}
});

