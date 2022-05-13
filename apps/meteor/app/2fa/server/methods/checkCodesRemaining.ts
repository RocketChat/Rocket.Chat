import { Meteor } from 'meteor/meteor';

Meteor.methods({
	'2fa:checkCodesRemaining'() {
		if (!Meteor.userId()) {
			throw new Meteor.Error('not-authorized');
		}

		const user = Meteor.user();

		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: '2fa:checkCodesRemaining',
			});
		}

		if (!user.services || !user.services.totp || !user.services.totp.enabled) {
			throw new Meteor.Error('invalid-totp');
		}

		return {
			remaining: user.services.totp.hashedBackup.length,
		};
	},
});
