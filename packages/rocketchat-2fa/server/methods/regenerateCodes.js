Meteor.methods({
	'2fa:regenerateCodes'(userToken) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('not-authorized');
		}

		const user = Meteor.user();

		if (!user.services || !user.services.totp || !user.services.totp.enabled) {
			throw new Meteor.Error('invalid-totp');
		}

		const verified = RocketChat.TOTP.verify({
			secret: user.services.totp.secret,
			token: userToken,
			userId: Meteor.userId(),
			backupTokens: user.services.totp.hashedBackup
		});

		if (verified) {
			const { codes, hashedCodes } = RocketChat.TOTP.generateCodes();

			RocketChat.models.Users.update2FABackupCodesByUserId(Meteor.userId(), hashedCodes);
			return { codes };
		}
	}
});
