Meteor.methods({
	'2fa:enable'() {
		if (!Meteor.userId()) {
			throw new Meteor.Error('not-authorized');
		}

		const user = Meteor.user();

		const secret = RocketChat.TOTP.generateSecret();

		RocketChat.models.Users.disable2FAAndSetTempSecretByUserId(Meteor.userId(), secret.base32);

		return {
			secret: secret.base32,
			url: RocketChat.TOTP.generateOtpauthURL(secret, user.username)
		};
	}
});
