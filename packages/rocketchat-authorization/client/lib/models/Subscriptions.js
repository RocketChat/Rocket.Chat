import _ from 'underscore';

if (_.isUndefined(RocketChat.models.Subscriptions)) {
	RocketChat.models.Subscriptions = {};
}

Object.assign(RocketChat.models.Subscriptions, {
	isUserInRole(userId, roleName, roomId) {
		if (roomId == null) {
			return false;
		}

		const query = {
			rid: roomId,
			roles: roleName
		};

		return !_.isUndefined(this.findOne(query));
	},

	findUsersInRoles(roles, scope, options) {
		roles = [].concat(roles);

		const query = {
			roles: { $in: roles }
		};

		if (scope) {
			query.rid = scope;
		}

		const subscriptions = this.find(query).fetch();

		const users = _.compact(_.map(subscriptions, function(subscription) {
			if ('undefined' !== typeof subscription.u && 'undefined' !== typeof subscription.u._id) {
				return subscription.u._id;
			}
		}));

		return RocketChat.models.Users.find({ _id: { $in: users } }, options);
	}
});
