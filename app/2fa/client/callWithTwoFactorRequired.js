import { Meteor } from 'meteor/meteor';
import { SHA256 } from 'meteor/sha';
import toastr from 'toastr';

import { modal } from '../../ui-utils';
import { t, APIClient } from '../../utils/client';

const methods = {
	totp: {
		text: 'Open_your_authentication_app_and_enter_the_code',
	},
	email: {
		text: 'Verify_your_email_for_the_code_we_sent',
		html: true,
	},
	password: {
		title: 'Please_enter_your_password',
		text: 'For_your_security_you_must_enter_your_current_password_to_continue',
		inputType: 'password',
	},
};

export function process2faReturn({ error, result, originalCallback, onCode, emailOrUsername }) {
	if (!error || (error.error !== 'totp-required' && error.errorType !== 'totp-required')) {
		return originalCallback(error, result);
	}

	const method = error.details && error.details.method;

	if (!emailOrUsername && Meteor.user()) {
		emailOrUsername = Meteor.user().username;
	}

	modal.open({
		title: t(methods[method].title || 'Two Factor Authentication'),
		text: t(methods[method].text),
		html: methods[method].html,
		type: 'input',
		inputActionText: method === 'email' && t('Send_me_the_code_again'),
		inputAction(e) {
			const { value } = e.currentTarget;
			e.currentTarget.value = t('Sending');
			APIClient.v1.post('users.2fa.sendEmailCode', {
				emailOrUsername,
			}).then(() => {
				e.currentTarget.value = value;
			});
		},
		inputType: methods[method].inputType || 'text',
		showCancelButton: true,
		closeOnConfirm: true,
		confirmButtonText: t('Verify'),
		cancelButtonText: t('Cancel'),
	}, (code) => {
		if (code === false) {
			return originalCallback(new Meteor.Error('totp-canceled'));
		}

		if (method === 'password') {
			code = SHA256(code);
		}
		onCode(code, method);
	});
}

const { call } = Meteor;
Meteor.call = function(ddpMethod, ...args) {
	const callback = args.pop();

	if (typeof callback !== 'function') {
		return call(ddpMethod, ...args, callback);
	}

	return call(ddpMethod, ...args, function(error, result) {
		process2faReturn({
			error,
			result,
			originalCallback: callback,
			onCode: (code, method) => {
				call('callWithTwoFactorRequired', { code, ddpMethod, method, params: args }, (error, result) => {
					if (error && error.error === 'totp-invalid') {
						toastr.error(t('Invalid_two_factor_code'));
						return callback(error);
					}

					callback(error, result);
				});
			},
		});
	});
};
