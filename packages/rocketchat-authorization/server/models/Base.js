RocketChat.models._Base.prototype.roleBaseQuery = function(/*userId, scope*/) {
	return;
};

RocketChat.models._Base.prototype.findRolesByUserId = function(userId/*, options*/) {
	const query = this.roleBaseQuery(userId);
	return this.find(query, { fields: { roles: 1 } });
};

RocketChat.models._Base.prototype.isUserInRole = function(userId, roleName, scope) {
	const query = this.roleBaseQuery(userId, scope);

	if (query == null) {
		return false;
	}

	query.roles = roleName;
	return !_.isUndefined(this.findOne(query));
};

RocketChat.models._Base.prototype.addRolesByUserId = function(userId, roles, scope) {
	roles = [].concat(roles);
	const query = this.roleBaseQuery(userId, scope);
	const update = {
		$addToSet: {
			roles: { $each: roles }
		}
	};
	return this.update(query, update);
};

RocketChat.models._Base.prototype.removeRolesByUserId = function(userId, roles, scope) {
	roles = [].concat(roles);
	const query = this.roleBaseQuery(userId, scope);
	const update = {
		$pullAll: {
			roles
		}
	};
	return this.update(query, update);
};

RocketChat.models._Base.prototype.findUsersInRoles = function() {
	throw new Meteor.Error('overwrite-function', 'You must overwrite this function in the extended classes');
};
