import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { settings } from '/app/settings';
import { callbacks } from '/app/callbacks';
import { TOTP } from './lib/totp';

Accounts.registerLoginHandler('totp', function(options) {
	if (!options.totp || !options.totp.code) {
		return;
	}

	return Accounts._runLoginHandlers(this, options.totp.login);
});

callbacks.add('onValidateLogin', (login) => {
	const twoFactorEnabledToUser = login.user.services && login.user.services.totp && login.user.services.totp.enabled === true;
	const currentLoginIsByTwoFactor = login.methodArguments && login.methodArguments[0] && login.methodArguments[0].totp;
	if (!settings.get('Accounts_TwoFactorAuthentication_Enabled') || (!currentLoginIsByTwoFactor && !twoFactorEnabledToUser)) {
		return;
	}
	if (currentLoginIsByTwoFactor && !twoFactorEnabledToUser) {
		throw new Meteor.Error('totp-disabled', 'You do not have 2FA login enabled for your user');
	}
	if (login.type === 'password' && twoFactorEnabledToUser && !currentLoginIsByTwoFactor) {
		throw new Meteor.Error('totp-required', 'TOTP Required');
	}
	const { totp } = login.methodArguments[0];

	if (!totp || !totp.code) {
		throw new Meteor.Error('totp-required', 'TOTP Required');
	}

	const verified = TOTP.verify({
		secret: login.user.services.totp.secret,
		token: totp.code,
		userId: login.user._id,
		backupTokens: login.user.services.totp.hashedBackup,
	});

	if (verified !== true) {
		throw new Meteor.Error('totp-invalid', 'TOTP Invalid');
	}
});
