import _ from 'underscore';

Meteor.methods({
	getRoomRoles(rid) {
		check(rid, String);

		if (!Meteor.userId() && RocketChat.settings.get('Accounts_AllowAnonymousRead') === false) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'getRoomRoles' });
		}

		check(rid, String);

		const options = {
			sort: {
				'u.username': 1
			},
			fields: {
				rid: 1,
				u: 1,
				roles: 1
			}
		};

		const UI_Use_Real_Name = RocketChat.settings.get('UI_Use_Real_Name') === true;

		const roles = RocketChat.models.Roles.find({ scope: 'Subscriptions', description: { $exists: 1, $ne: '' } }).fetch();
		const subscriptions = RocketChat.models.Subscriptions.findByRoomIdAndRoles(rid, _.pluck(roles, '_id'), options).fetch();

		if (!UI_Use_Real_Name) {
			return subscriptions;
		} else {
			return subscriptions.map(subscription => {
				const user = RocketChat.models.Users.findOneById(subscription.u._id);
				subscription.u.name = user && user.name;
				return subscription;
			});
		}
	}
});
