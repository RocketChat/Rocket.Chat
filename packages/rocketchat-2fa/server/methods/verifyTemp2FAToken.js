const speakeasy = Npm.require('speakeasy');

Meteor.methods({
	verifyTemp2FAToken(userToken) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('not-authorized');
		}

		const user = Meteor.user();

		if (!user.services || !user.services.totp || !user.services.totp.tempSecret) {
			throw new Meteor.Error('invalid-totp');
		}

		const verified = speakeasy.totp.verify({
			secret: user.services.totp.tempSecret,
			encoding: 'base32',
			token: userToken
		});

		if (verified) {
			// generate 10 backup codes
			const codes = [];
			const hashedCodes = [];
			for (let i = 0; i < 10; i++) {
				const code = Random.id(8);
				codes.push(code);
				hashedCodes.push(SHA256(code));
			}

			RocketChat.models.Users.enable2FAAndSetSecretAndCodesByUserId(Meteor.userId(), user.services.totp.tempSecret, hashedCodes);
			return { codes };
		}
	}
});
