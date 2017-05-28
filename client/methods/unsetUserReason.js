Meteor.methods({
	unsetUserReason(userId) {
		Meteor.users.update(userId, { $unset: { 'reason' : 1 } });
		return true;
	}
});
