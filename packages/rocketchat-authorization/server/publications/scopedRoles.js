/**
 * Publish logged-in user's roles so client-side checks can work.
 */
Meteor.publish('scopedRoles', function (scope) {
	if (!this.userId || _.isUndefined(RocketChat.models[scope]) || !_.isFunction(RocketChat.models[scope].findRolesByUserId)) {
		this.ready();
		return;
	}

	return RocketChat.models[scope].findRolesByUserId(this.userId);
});
