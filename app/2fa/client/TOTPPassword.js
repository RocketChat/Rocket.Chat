// import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import toastr from 'toastr';

import { t } from '../../utils';
import { process2faReturn } from './callWithTwoFactorRequired';

function reportError(error, callback) {
	if (error?.error === 'totp-invalid') {
		toastr.error(t('Invalid_two_factor_code'));
		return callback?.();
	}

	if (callback) {
		return callback(error);
	}

	throw error;
}

// Meteor.loginWithPasswordAndTOTP = function(selector, password, code, callback) {
// 	if (typeof selector === 'string') {
// 		if (selector.indexOf('@') === -1) {
// 			selector = { username: selector };
// 		} else {
// 			selector = { email: selector };
// 		}
// 	}

// 	Accounts.callLoginMethod({
// 		methodArguments: [{
// 			totp: {
// 				login: {
// 					user: selector,
// 					password: Accounts._hashPassword(password),
// 				},
// 				code,
// 			},
// 		}],
// 		userCallback(error) {
// 			if (error) {
// 				reportError(error, callback);
// 			} else {
// 				callback && callback();
// 			}
// 		},
// 	});
// };

// const { loginWithPassword } = Meteor;

// Meteor.loginWithPassword = function(email, password, cb) {
// 	loginWithPassword(email, password, (error) => {
// 		process2faReturn({
// 			error,
// 			originalCallback: cb,
// 			emailOrUsername: email,
// 			onCode: (code) => {
// 				Meteor.loginWithPasswordAndTOTP(email, password, code, (error) => {
// 					if (error && error.error === 'totp-invalid') {
// 						toastr.error(t('Invalid_two_factor_code'));
// 						cb();
// 					} else {
// 						cb(error);
// 					}
// 				});
// 			},
// 		});
// 	});
// };

const { callLoginMethod } = Accounts;

Accounts.callLoginMethod = function({ userCallback, methodArguments, originalUserCallback = userCallback, originalMethodArguments = methodArguments, ...options }) {
	callLoginMethod.bind(Accounts)({
		userCallback: (error) => {
			if (!error) {
				return originalUserCallback?.();
			}

			process2faReturn({
				error,
				originalCallback: originalUserCallback,
				// emailOrUsername: email, // TODO: need to get the email from the error result in someway
				onCode(code) {
					const [login, ...otherMethodArguments] = originalMethodArguments || [];
					Accounts.callLoginMethod({
						methodArguments: [{
							totp: {
								code,
								login,
							},
						}, ...otherMethodArguments],
						userCallback: (error) => {
							if (error) {
								reportError(error, userCallback);
							} else {
								originalUserCallback?.();
							}
						},
					});
				},
			});
		},
		methodArguments,
		...options,
		originalUserCallback,
		originalMethodArguments,
	});
};
