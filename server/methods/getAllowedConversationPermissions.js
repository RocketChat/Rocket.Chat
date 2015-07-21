Meteor.methods( {
	/**
	 * Retrieve AccessPermission(s) assignable to a conversation based on the conversation 
	 * members.  
	 * @param  {[String]} userIds identifies the user(s) participating in the conversation
	 * @return { allowed : 'access permissions applicable to the conversation',
	 *           selected : 'access permissions that are initially selected',
	 *           disabled : 'access permissions that cannot be selected/deselected'} 
	 */
	getAllowedConversationPermissions : function(parameters) {

		var	userIds = [],// = parameters.userIds,
			allowedPermissionIds = [],
			requiredIds = [],
			systemCountryCode = Meteor.settings.public.system.countryCode || '300',
			membersCountryCodes = [],
			userAccessIds = [],
			allReleaseCaveatIds = Jedis.accessManager.getPermissionIdsByType("Release Caveat"),
			options = {};

		check(Meteor.userId(), String);
		check(userIds,[String] );
		//if( _.isEmpty(userIds) ) {
		//	throw Meteor.Error(400, 'Must specify at least one userId');
		//}
		userIds.push(Meteor.userId());
		if (parameters.usernames) {
			parameters.usernames.forEach(function(username) {
				var userId = Meteor.users.findOne({'username': username})._id;
				if (userId) {
					userIds.push(userId);
				}
			});
		}

		// set of options that the use can choose from. The Classification/SCI/SAP are restricted to 
		// permissions that all members have in common.  However, all Release Caveat permissions are 
		// allowed
		allowedPermissionIds = _.chain(allowedPermissionIds)
			.push(Jedis.accessManager.getCommonPermissionIds(userIds))
			.push(allReleaseCaveatIds)
			.flatten()
			.uniq()
			.value();
		options.allowed = Jedis.accessManager.getPermissions(allowedPermissionIds);

		// contains all types of permissions, but we can't differentiate because it's only the id
		userAccessIds = Meteor.users.find({_id: {$in : userIds }}, {field: {'profile.access' : 1}}).fetch();
		// filter to get only release caveat ids
		membersCountryCodes = _.chain(userAccessIds)
			.pluck('profile')
			.pluck('access')
			.flatten()
			.uniq()
			.filter( function(id) { return _.contains( allReleaseCaveatIds, id )})
			.value();

		// the system country code is required because the host country always has access
		// the members country codes are required so that members can view the conversation
		requiredIds = _.chain([])
			.push(systemCountryCode)
			.push(membersCountryCodes)
			.flatten()
			.uniq()
			.value();

		// selected options
		var resourceClassifications, ids = [];
		if (parameters.conversationId) {
			resourceClassifications  = Meteor.call('conversationClassifications', parameters.conversationId);
		}
		if (resourceClassifications) {
			ids.push(resourceClassifications.selected);
		}
		// system country code, members country codes
		// if relabeling conversation, then its current classification level
		options.selectedIds = _.chain([])
			.push(ids)
			.push(requiredIds)
			.flatten()
			.uniq()
			.value();

		// disabled options
		ids = [];
		if (resourceClassifications) {
			ids.push(resourceClassifications.conversation.accessPermissions);
			ids.push(resourceClassifications.lower);
		}
		// system country code, members country codes
		// if relabeling conversation, then its current labels and classifications lower then the 
		// selected label
		options.disabledIds = _.chain([])
			.push(requiredIds)
			.push(ids)
			.flatten()
			.uniq()
			.value();
		return options;
	}
});