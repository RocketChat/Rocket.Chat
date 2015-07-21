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
//
Jedis.AccessPermission.prototype.resourceClassifications = function() {
	var classInfo = { selected:null, higher:[], lower:[] };
	var classifications = Jedis.accessManager.getClassifications();
	var classificationIds = _.pluck(classifications, '_id');
	// Get the classification from the access permissions
	var resourceClassificationIds = _.filter(_.pluck(this.classification,'_id'), function(id) {
		return _.contains(classificationIds ,id);
	});
	if (resourceClassificationIds.length > 1)  {
		console.warn('Resource permissions has more then one classifications' + resourceClassificationIds.length )
	}
	var resourceClassificationId = resourceClassificationIds[0];
	_.each(classifications, function(element, index, list) {
		var cid = element._id;
		if (cid === resourceClassificationId) {
			classInfo.selected = cid;
		} else if ( ! classInfo.selected) {
			classInfo.higher.push(cid);
		} else {
			classInfo.lower.push(cid);
		}
	});
	return classInfo;
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
	//console.log("canAccessResource: user perms: ", this.toString());
	//console.log("canAccessResource: resource perms: ", resPerms.toString());

	var userIds = this.getPermissionIds(andTypes);
	// Note: The following will short-circuit on failure.
	var fail =
		// AND logic
		resPerms.getPermissionIds(andTypes).some(function(resId) {
			return userIds.indexOf(resId) === -1;
		});
	if (!fail) {
		// OR logic
		var resIds = resPerms.getPermissionIds(orTypes);
		userIds = this.getPermissionIds(orTypes);
		if (resIds.length) {
			fail = resIds.every(function(resId) {
				return userIds.indexOf(resId) === -1;
			});
		}
	}
	//console.log("canAccessResource says: ", fail ? "fail" : "pass");
	return !fail;
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

// vim:ts=4:sw=4:tw=120
