import { Meteor } from 'meteor/meteor';
import toastr from 'toastr';
import { Accounts } from 'meteor/accounts-base';

import { t } from '../../../utils/client';
import { process2faReturn } from '../callWithTwoFactorRequired';

export class Utils2fa {
	static reportError(error, callback) {
		if (callback) {
			callback(error);
		} else {
			throw error;
		}
	}

	static convertError(err) {
		if (err && err instanceof Meteor.Error && err.error === Accounts.LoginCancelledError.numericError) {
			return new Accounts.LoginCancelledError(err.reason);
		}

		return err;
	}

	static overrideLoginMethod(loginMethod, loginArgs, cb, loginMethodTOTP, emailOrUsername) {
		loginMethod.apply(this, loginArgs.concat([(error) => {
			if (!error || error.error !== 'totp-required') {
				return cb(error);
			}

			process2faReturn({
				error,
				emailOrUsername,
				originalCallback: cb,
				onCode: (code) => {
					loginMethodTOTP && loginMethodTOTP.apply(this, loginArgs.concat([code, (error) => {
						if (error) {
							console.log(error);
						}
						if (error && error.error === 'totp-invalid') {
							toastr.error(t('Invalid_two_factor_code'));
							cb();
						} else {
							cb(error);
						}
					}]));
				},
			});
		}]));
	}
}
