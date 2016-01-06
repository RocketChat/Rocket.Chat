if (_.isUndefined(RocketChat.models.Subscriptions)) {
	RocketChat.models.Subscriptions = {}
}

RocketChat.models.Subscriptions.findRolesByUserId = function(userId) {
	query = {
		"u._id": userId
	};

	options = { fields: { roles: 1 } }

	return this.find(query, options);
}

RocketChat.models.Subscriptions.isUserInRole = function(userId, roleName, roomId) {
	query = {
		"u._id": userId,
		rid: roomId,
		roles: roleName
	};

	return !_.isUndefined(this.findOne(query));
}

RocketChat.models.Subscriptions.setRolesByUserId = function(userId, roles, roomId) {
	roles = [].concat(roles);

	var query = {
		"u._id": userId,
		rid: roomId
	}

	var update = {
		$set: {
			roles: roles
		}
	}

	return this.update(query, update);
}

RocketChat.models.Subscriptions.addRolesByUserId = function(userId, roles, roomId) {
	roles = [].concat(roles);

	var query = {
		"u._id": userId,
		rid: roomId
	}

	var update = {
		$addToSet: {
			roles: { $each: roles }
		}
	}

	return this.update(query, update);
}

RocketChat.models.Subscriptions.removeRolesByUserId = function(userId, roles, roomId) {
	roles = [].concat(roles);

	var query = {
		"u._id": userId,
		rid: roomId
	}

	var update = {
		$pullAll: {
			roles: roles
		}
	}

	return this.update(query, update);
}

RocketChat.models.Subscriptions.findUsersInRoles = function(roles, scope, options) {
	roles = [].concat(roles);

	var query = {
		roles: { $in: roles }
	}

	if (scope) {
		query.rid = scope;
	}

	subscriptions = this.find(query).fetch();

	users = _.compact(_.map(subscriptions, function(subscription) {
		if ('undefined' !== typeof subscription.u && 'undefined' !== typeof subscription.u._id)
			return subscription.u._id
	}));

	return RocketChat.models.Users.find({ _id: { $in: users } }, options);
}
