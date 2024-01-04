import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';

import { process2faReturn } from '../../../client/lib/2fa/process2faReturn';
import { isTotpInvalidError, isTotpMaxAttemptsError, reportError } from '../../../client/lib/2fa/utils';
import { dispatchToastMessage } from '../../../client/lib/toast';
import { t } from '../../utils/lib/i18n';

Meteor.loginWithPasswordAndTOTP = function (selector, password, code, callback) {
	if (typeof selector === 'string') {
		if (selector.indexOf('@') === -1) {
			selector = { username: selector };
		} else {
			selector = { email: selector };
		}
	}

	Accounts.callLoginMethod({
		methodArguments: [
			{
				totp: {
					login: {
						user: selector,
						password: Accounts._hashPassword(password),
					},
					code,
				},
			},
		],
		userCallback(error) {
			if (error) {
				reportError(error, callback);
			} else {
				callback && callback();
			}
		},
	});
};

const { loginWithPassword } = Meteor;

Meteor.loginWithPassword = function (email, password, cb) {
	loginWithPassword(email, password, async (error) => {
		await process2faReturn({
			error,
			originalCallback: cb,
			emailOrUsername: email,
			onCode: (code) => {
				Meteor.loginWithPasswordAndTOTP(email, password, code, (error) => {
					if (isTotpMaxAttemptsError(error)) {
						dispatchToastMessage({
							type: 'error',
							message: t('totp-max-attempts'),
						});
						cb();
						return;
					}
					if (isTotpInvalidError(error)) {
						dispatchToastMessage({
							type: 'error',
							message: t('Invalid_two_factor_code'),
						});
						cb();
						return;
					}
					cb(error);
				});
			},
		});
	});
};
