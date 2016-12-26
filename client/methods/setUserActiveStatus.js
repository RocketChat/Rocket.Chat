Meteor.methods({
	setUserActiveStatus(userId, active) {
		Meteor.users.update(userId, { $set: { active: active } });
		return true;
	}
});
