if (_.isUndefined(RocketChat.models.Users)) {
	RocketChat.models.Users = {}
}

RocketChat.models.Users.findRolesByUserId = function(userId) {
	var query = {
		_id: userId
	};

	options = { fields: { roles: 1 } }

	return this.find(query, options);
};

RocketChat.models.Users.isUserInRole = function(userId, roleName) {
	query = {
		_id: userId,
		roles: roleName
	};

	return !_.isUndefined(this.findOne(query));
}

RocketChat.models.Users.setRolesByUserId = function(userId, roles) {
	roles = [].concat(roles);

	var query = {
		_id: userId
	}

	var update = {
		$set: {
			roles: roles
		}
	}

	return this.update(query, update);
}

RocketChat.models.Users.addRolesByUserId = function(userId, roles) {
	roles = [].concat(roles);

	var query = {
		_id: userId
	}

	var update = {
		$addToSet: {
			roles: { $each: roles }
		}
	}

	return this.update(query, update);
}

RocketChat.models.Users.removeRolesByUserId = function(userId, roles) {
	roles = [].concat(roles);

	var query = {
		_id: userId
	}

	var update = {
		$pullAll: {
			roles: roles
		}
	}

	return this.update(query, update);
}

RocketChat.models.Users.findUsersInRoles = function(roles, scope, options) {
	roles = [].concat(roles);

	var query = {
		roles: { $in: roles }
	}

	return this.find(query, options);
}
