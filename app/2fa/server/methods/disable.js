import { Meteor } from 'meteor/meteor';

import { Users } from '../../../models';
import { TOTP } from '../lib/totp';
import { require2fa } from '../methodWrapper';
import { checkCodeForUser } from '../code';

Meteor.methods({
	'2fa:disable'(code) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('not-authorized');
		}

		const user = Meteor.user();

		const verified = TOTP.verify({
			secret: user.services.totp.secret,
			token: code,
			userId: Meteor.userId(),
			backupTokens: user.services.totp.hashedBackup,
		});

		if (!verified) {
			return false;
		}

		return Users.disable2FAByUserId(Meteor.userId());
	},
});

Meteor.methods({
	test: require2fa(() => {
		console.log('foi');
		return 'foi';
	}),
});


Meteor.methods({
	callWith2fa({ code, method, params }) {
		if (!this.userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'callWith2fa' });
		}

		const user = Users.findOneById(this.userId);

		checkCodeForUser(user, code);

		this.twoFactorChecked = true;
		return Meteor.server.method_handlers[method].apply(this, params);
	},
});
