import { Migrations } from '/app/migrations';
import { Users, Subscriptions } from '/app/models';
import _ from 'underscore';

Migrations.add({
	version: 60,
	up() {
		let subscriptions = Subscriptions.find({ $or: [{ name: { $exists: 0 } }, { name: { $not: { $type: 2 } } }] }).fetch();
		if (subscriptions && subscriptions.length > 0) {
			Subscriptions.remove({ _id: { $in: _.pluck(subscriptions, '_id') } });
		}

		subscriptions = Subscriptions.find().forEach(function(subscription) {
			const user = Users.findOne({ _id: subscription && subscription.u && subscription.u._id });
			if (!user) {
				Subscriptions.remove({ _id: subscription._id });
			}
		});
	},
});
