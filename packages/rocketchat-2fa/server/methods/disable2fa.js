Meteor.methods({
	disable2fa(code) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('not-authorized');
		}

		const user = Meteor.user();

		const verified = RocketChat.TOTP.verify(user.services.totp.secret, code);

		if (!verified) {
			return false;
		}

		return RocketChat.models.Users.disable2FAByUserId(Meteor.userId());
	}
});
