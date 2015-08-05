Jedis = this.Jedis || {};
// Class for managing user/resource permissions.
// Structure: Hash of arrays of AccessPermission objects (see Schemas.AccessPermission), keyed by "type", which will be
// one of the following:
//   classification
//   SAP
//   SCI
//   Release Caveat
// Example:
// {
//   "classification": ["TS", "S", "C", "U"],
//   "SAP: [
//     { "_id" : "107", "trigraph" : "QUE", "label" : "Quesadilla", "type" : "SAP" },
//     { "_id" : "108", "trigraph" : "HAB", "label" : "Habanero", "type" : "SAP" }
//   ]
// }
//

// Construct an AccessPermission object from a list of access ids.
Jedis.AccessPermission = function(ids) {
	if (!(this instanceof arguments.callee)) {
		// We were called without `new' operator.
		return new arguments.callee(arguments);
	}
	// Allow any of the supported input types to be passed as scalar.
	if (!_.isArray(ids)) {
		ids = [ids];
	}
	// Now we have array, but of what? String id or Schema.AccessPermission objects?
	// Assumption: Whichever it is, list should be homogeneous.
	if (!ids.length) {
		// Empty object
		return this;
	}
	// Ensure we have a list of objects for grouping stage.
	var perms = typeof ids[0] === 'object'
		? ids
		: AccessPermissions.find({_id: {$in : ids}}).fetch();

	// Group by types.
	perms.reduce(function(o, perm) {
		var type = perm.type;
		o[type] = o[type] || [];
		o[type].push(perm);
		return o;
	}, this);
};

// Return a flat list of ids whose types are in the provided list (default all)
// Design Intent: The object instance maintains the full access permission object, but in some scenarios (e.g., calls to
// external validation service), we may need only the ids, possibly only the ids for specific types.
Jedis.AccessPermission.prototype.getPermissionIds = function(types) {
	var self = this;
	if (typeof types === 'string') {
		types = [types];
	}
	// Default (no types specified) means all types defined for this instance.
	types = types || _.keys(self);
	return types.reduce(function(acc, type) {
		return self[type] ? acc.concat(_.pluck(self[type], '_id')) : acc;
	}, []);
};

// Return true iff invocant has sufficient permissions to access input resource.
// TODO - Consider pros/cons with strategy vs instance method approach. First let's implement it all within the class.
Jedis.AccessPermission.prototype.canAccessResource = function(resPerms) {
	var andTypes = ['SCI', 'SAP', 'classification'],
		orTypes = ['Release Caveat'];
	
	var userIds, canAccess;
	var failIds = [];

	// "AND" logic - user needs access to ALL of them
	// loop through all test permissions and check if user can access
	// for any that can't access, add it to 'failIds' list
	userIds = this.getPermissionIds(andTypes);
	resPerms.getPermissionIds(andTypes).forEach(function(resId) {
		if (userIds.indexOf(resId) === -1) {
			failIds.push(resId);
		}
	});


	// "OR" logic - user needs access to only ONE OR MORE of them
	// loop through all test permissions and check if user can access
	// if user can't access any, add his own relto ids to the 'failIds' list
	// (this is so we can determine what the problem is. otherwise, the fail
	//  list could conceivably hold many reltos, when the issue is that the
	//  user is lacking any one of them)
	userIds = this.getPermissionIds(orTypes);
	var anyAccess = resPerms.getPermissionIds(orTypes).some(function(resId) {
		return userIds.indexOf(resId) > -1;
	});
	if (anyAccess === false) {
		// can a user ever have multiple reltos?
		failIds = failIds.concat(userIds);
	}


	// if any ids were added to 'failIds', user cannot access
	if (failIds.length > 0) {
		canAccess = false;
	}
	else {
		canAccess = true;
	}

	return { canAccess: canAccess, failIds: _.uniq(failIds) }
};



// Convert hash of lists keyed by type to flat list.
Jedis.AccessPermission.prototype.toArray = function() {
	return _.values(this).reduce(function(acc, perms) {
		return acc.concat(perms);
	}, []);
};

// --- Debug/Test methods ---
// Add permission object(s) represented by input id(s).
Jedis.AccessPermission.prototype.addAccessIds = function(ids) {
	ids = _.isArray(ids) ? ids : [ids];
	// Lookup input ids and add corresponding objects under applicable keys (if not already there).
	_.pairs(
		_.groupBy(
			AccessPermissions.find({_id: {$in: ids}}).fetch(),
			function(perm) { return perm.type }))
		// Iterate [type, perm_ary] pairs.
		.forEach(function(pair) {
			var type = pair[0], perms = pair[1];
			this[type] = this[type] || [];
			// Merge the (unique) new access objects.
			this[type] = _.uniq(this[type].concat(perms),
				function(perm) { return perm._id })
		}, this);
};

// Remove permission object(s) represented by input id(s).
Jedis.AccessPermission.prototype.removeAccessIds = function(ids) {
	ids = _.isArray(ids) ? ids : [ids];
	// Remove access objects (from under their respective keys) whose id is found in input list.
	// Iterate access types (object's own enumerable properties)
	// Idiosyncrasy: Underscore docs say mapObject, but map is actually overloaded.
	_.map(this, function(perms, type) {
		this[type] = perms.filter(function(perm) { return ids.indexOf(perm._id) === -1 });
	}, this);
};

Jedis.AccessPermission.prototype.toString = function() {
	return JSON.stringify(this, undefined, 4);
};

Jedis.AccessPermission.prototype.containsAll = function(permissionIds) {
	var inCommon = _.intersection( permissionIds, this.getPermissionIds());
	return inCommon.length === permissionIds.length
}

// vim:ts=4:sw=4:tw=120
