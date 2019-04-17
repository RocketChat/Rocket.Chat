import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { modal } from '../../ui-utils';
import { t } from '../../utils';
import toastr from 'toastr';
import { check } from 'meteor/check';

function reportError(error, callback) {
	if (callback) {
		callback(error);
	} else {
		throw error;
	}
}

Meteor.loginWithPasswordAndTOTP = function(selector, password, code, callback) {
	if (typeof selector === 'string') {
		if (selector.indexOf('@') === -1) {
			selector = { username: selector };
		} else {
			selector = { email: selector };
		}
	}

	Accounts.callLoginMethod({
		methodArguments: [{
			totp: {
				login: {
					user: selector,
					password: Accounts._hashPassword(password),
				},
				code,
			},
		}],
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

Meteor.loginWithPassword = function(email, password, cb) {
	loginWithPassword(email, password, (error) => {
		if (!error || error.error !== 'totp-required') {
			return cb(error);
		}

		modal.open({
			title: t('Two-factor_authentication'),
			text: t('Open_your_authentication_app_and_enter_the_code'),
			type: 'input',
			inputType: 'text',
			showCancelButton: true,
			closeOnConfirm: true,
			confirmButtonText: t('Verify'),
			cancelButtonText: t('Cancel'),
		}, (code) => {
			if (code === false) {
				return cb();
			}

			Meteor.loginWithPasswordAndTOTP(email, password, code, (error) => {
				if (error && error.error === 'totp-invalid') {
					toastr.error(t('Invalid_two_factor_code'));
					cb();
				} else {
					cb(error);
				}
			});
		});
	});
};

const resetPasswordWithTOTP = function(token, newPassword, code, cb) {
	check(token, String);
	check(newPassword, String);

	if (!newPassword) {
		return reportError(new Meteor.Error(400, 'Password may not be empty'), cb);
	}

	Accounts.callLoginMethod({
		methodName: 'resetPasswordWithTOTP',
		methodArguments: [token, Accounts._hashPassword(newPassword), code],
		userCallback: cb,
	});
};

Accounts.resetPassword = function(token, newPassword, cb) {
	resetPasswordWithTOTP(token, newPassword, undefined, (error) => {
		if (!error || error.error !== 'totp-required') {
			return cb(error);
		}

		modal.open({
			title: t('Two-factor_authentication'),
			text: t('Open_your_authentication_app_and_enter_the_code'),
			type: 'input',
			inputType: 'text',
			showCancelButton: true,
			closeOnConfirm: true,
			confirmButtonText: t('Verify'),
			cancelButtonText: t('Cancel'),
		}, (code) => {
			if (code === false) {
				return cb();
			}

			resetPasswordWithTOTP(token, newPassword, code, (error) => {
				if (error && error.error === 'totp-invalid') {
					toastr.error(t('Invalid_two_factor_code'));
					cb();
				} else {
					cb(error);
				}
			});
		});
	});
};
