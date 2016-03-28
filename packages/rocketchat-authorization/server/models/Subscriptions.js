RocketChat.models.Subscriptions.roleBaseQuery = function(userId, scope) {
	var query = { 'u._id': userId };
	if (!_.isUndefined(scope)) {
		query.rid = scope;
	}
	return query;
};

RocketChat.models.Subscriptions.findUsersInRoles = function(roles, scope, options) {
	roles = [].concat(roles);

	var query = {
		roles: { $in: roles }
	};

	if (scope) {
		query.rid = scope;
	}

	var subscriptions = this.find(query).fetch();

	var users = _.compact(_.map(subscriptions, function(subscription) {
		if ('undefined' !== typeof subscription.u && 'undefined' !== typeof subscription.u._id) {
			return subscription.u._id;
		}
	}));

	return RocketChat.models.Users.find({ _id: { $in: users } }, options);
};
