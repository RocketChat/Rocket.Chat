const speakeasy = Npm.require('speakeasy');

Meteor.methods({
	verifyTemp2FAToken(userToken) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('not-authorized');
		}

		const user = Meteor.user();

		if (!user.services || !user.services.totp || !user.services.totp.tempSecret) {
			console.error('errour');
			return false;
		}

		const verified = speakeasy.totp.verify({
			secret: user.services.totp.tempSecret,
			encoding: 'base32',
			token: userToken
		});

		if (verified) {
			RocketChat.models.Users.enable2FAAndSetSecretByUserId(Meteor.userId(), user.services.totp.tempSecret);
		}
		return verified;
	}
});
