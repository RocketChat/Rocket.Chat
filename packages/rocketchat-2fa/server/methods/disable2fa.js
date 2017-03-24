Meteor.methods({
	disable2fa() {

		if (!Meteor.userId()) {
			throw new Meteor.Error('not-authorized');
		}

		return RocketChat.models.Users.disable2FAByUserId(Meteor.userId());
	}
});
