// Constructor

AccessManager = function(accessProvider) {
	var getUserAccessIds = function(userId) {
		return Meteor.users.findOne({_id: userId}).profile.access;
	};

	var getUserAccessPermissions = function(userId) {
		var accessPermissionIds = Meteor.users.findOne({_id: userId}).profile.access;
		if (typeof accessPermissionIds === 'string') {
			accessPermissionIds = [accessPermissionIds];
		}
		//return Meteor.user().profile.accessPermissions || {};
		// returns AccessPermission objects for given ids
		permissions = Jedis.accessManager.getPermissions(accessPermissionIds);
		console.log("permissions: ", permissions);
		// classifications are defined at the application level and not by underlying data provider
		// e.g. not stored in LDAP. 
		permissions = permissions.concat(Jedis.accessManager.getClassifications());

		return permissions.reduce( function(map, permission) {
			// group by permission type
			var type = permission.type;
			map[type] = map[type] || [];
			map[type].push(permission);
			return map;
		}, {}); 
	};

	// Can user with input permissions access the resource (e.g., conversation) with input permissions?
	// Input Format: Schemas.AccessPermission
	var hasPermission = function(userPermissions, resPermissions) {
		//console.log("hasPermission: user ", JSON.stringify(userPermissions, undefined, true));
		//console.log("hasPermission: res  ", JSON.stringify(resPermissions, undefined, true));
		// Check SCI/SAP
		return !['SCI', 'SAP'].some(function(type) {
			var resPerms = resPermissions[type],
				userPerms = userPermissions[type];
			// If SCI/SAP not defined for resource, pass.
			if (!resPerms) { return false }
			// If SCI/SAP defined for resource, but user has none, fail.
			if (!userPerms) { return true }
			var userIds = userPerms.map(function(v) { return v._id });
			return resPerms
				.map(function(v) { return v._id })
				.some(function(resId) {
					return !userIds.includes(resId)
				});
		});
	};

	var loadAccessPermissions = function() {
		var accessPermissions = accessProvider.getAccessPermissions() || [];
		accessPermissions = accessPermissions.concat(getClassifications());
		// Meteor requires an empty selector to delete all documents.  If undefined,
		// then no documents will be removed as a safety measure.
		AccessPermissions.remove({});
		// NOTE: Meteor currently doesn't support bulk insert using an array of documents
		// (it inserts the documents as one array).  Thus, we have to insert it 
		// one by one. 
		accessPermissions.forEach( function(permission) {
			AccessPermissions.insert(permission);
		});

	};

	var getClassifications = function(permissions) {
		// TODO this should be read in from configurable property file
		return [{_id: 'TS', trigraph:'TS', label: 'Top Secret', type:'classification'},
				{_id: 'S', trigraph:'S', label: 'Secret', type:'classification'},
				{_id: 'C', trigraph:'C', label: 'Confidential', type:'classification'},
				{_id: 'U', trigraph: 'U', label: 'Unclassified', type:'classification'}	
				];
	};

	// Given a list of access id's, return corresponding objects.
	var getPermissions = function(ids) {
		if( !_.isArray(ids) ) {
			ids = [ids];
		}
		//console.log("getPermissions operating on: ", ids);
		return AccessPermissions.find({_id: {$in : ids}}).fetch();
	};

	var getPermissionIdsByType = function(types) {
		var perms;
		if( !_.isArray(types) ) {
			types = [types];
		}
		perms = AccessPermissions.find({type: {$in : types}}, {fields : {'_id':1}}).fetch();
		return _.pluck(perms, '_id');
	};

	var getCommonPermissionIds = function(userIds) {
		// extract method to allow unit testing without call to Meteor.userId() 
		var users, 
			firstUser,
			inCommonPermissionIds = [];

		// ignore empty parameter
		userIds = userIds || [];
		userIds = _.uniq(userIds);
		// TODO is there a way to use Mongo to find common permissions?
		// find intersections of access permission ids for specified users
		foundUsers = Meteor.users.find({_id : { $in : userIds}}, {fields: {'profile.access':1}}).fetch();
		if( !_.isEmpty( foundUsers) && userIds.length === foundUsers.length) {
			// set initial permissions based on first user
			firstUser = foundUsers.pop();
			inCommonPermissionIds = firstUser.profile.access;
			// compare subsequent users against first user's permissions
			foundUsers.forEach( function(user) {
				var userPermissions = user.profile.access || [];
				inCommonPermissionIds = _.intersection( inCommonPermissionIds, userPermissions);
			});
		}	
		return inCommonPermissionIds;
	};

	return {
		// Public API
		/**
		 * Load access permission definitions from access provider into AccessPermissions 
		 * collection.  Retrieves access permissions from underlying provider and augment 
		 * with system defined classifications.
		 */
		loadAccessPermissions : loadAccessPermissions,
		/**
		 * Retrieve the classfications that ALL users posses as defined by environment. 
		 * @type array of AccessPermission objects representing classifications
		 */
		getClassifications : getClassifications,
		/**
		 * Retrieve AccessPermission object(s) specified by their unique identifier
		 * @type String or Array of Strings representing an AccessPermission to retrieve. 
		 * @return [{_id:String, trigraph:String, label:String, type:String}] array of AccessPermission objects
		 */
		getPermissions : getPermissions,
		/**
		 * Retrieve AccessPermission identifier(s) specified by their type
		 * @type String or Array of Strings representing the type of AccessPermission to retrieve. 
		 * @return [_id:String] array of AccessPermission identifier(s)
		 */
		getPermissionIdsByType : getPermissionIdsByType,

		getUserAccessIds: getUserAccessIds,
		getUserAccessPermissions: getUserAccessPermissions,
		hasPermission: hasPermission,
		/**
		 * Retrieve the intersection of access permission(s) for the specified user identifier(s)
		 * @param  {[String]} userIds identifies the user(s) whose common access permission(s) will be
		 * retrieved.
		 * @return {[String]} Access permission identifiers(s) common to specified user(s).  Empty array if no common access permission
		 */
		getCommonPermissionIds : getCommonPermissionIds,
	}

};

// vim:ts=4:sw=4:tw=120
