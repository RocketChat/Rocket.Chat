const speakeasy = Npm.require('speakeasy');

Meteor.methods({
	enable2fa() {
		if (!Meteor.userId()) {
			throw new Meteor.Error('not-authorized');
		}

		const user = Meteor.user();

		const secret = speakeasy.generateSecret();

		RocketChat.models.Users.disable2FAAndSetTempSecretByUserId(Meteor.userId(), secret.base32);

		return {
			url: speakeasy.otpauthURL({
				secret: secret.ascii,
				label: `Rocket.Chat:${ user.username }`
			})
		};
	}
});
