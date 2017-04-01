Meteor.methods({
	'2fa:checkCodesRemaining'() {
		if (!Meteor.userId()) {
			throw new Meteor.Error('not-authorized');
		}

		const user = Meteor.user();

		if (!user.services || !user.services.totp || !user.services.totp.enabled) {
			throw new Meteor.Error('invalid-totp');
		}

		return {
			remaining: user.services.totp.hashedBackup.length
		};
	}
});
