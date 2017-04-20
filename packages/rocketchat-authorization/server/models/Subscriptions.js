RocketChat.models.Subscriptions.roleBaseQuery = function(userId, scope) {
	if (scope == null) {
		return;
	}

	const query = { 'u._id': userId };
	if (!_.isUndefined(scope)) {
		query.rid = scope;
	}
	return query;
};

RocketChat.models.Subscriptions.findUsersInRoles = function(roles, scope, options) {
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
};
