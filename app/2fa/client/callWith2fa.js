import { Meteor } from 'meteor/meteor';
import toastr from 'toastr';

import { modal } from '../../ui-utils';
import { t } from '../../utils';

export function process2faReturn({ error, result, originalCallback, onCode, emailOrUsername }) {
	if (!error || error.error !== 'totp-required') {
		return originalCallback(error, result);
	}

	modal.open({
		title: t('Two-factor_authentication'),
		text: error.details === 'email' ? 'Verify your email for the code we sent.' : t('Open_your_authentication_app_and_enter_the_code'), // TODO: translate
		html: error.details === 'email',
		type: 'input',
		inputActionText: error.details && 'Send me the code again', // TODO: translate
		inputAction(e) {
			window.a = e;
			const { value } = e.currentTarget;
			e.currentTarget.value = 'Sending';
			Meteor.call('sendEmailCode', emailOrUsername, () => {
				e.currentTarget.value = value;
			});
		},
		inputType: 'text',
		showCancelButton: true,
		closeOnConfirm: true,
		confirmButtonText: t('Verify'),
		cancelButtonText: t('Cancel'),
	}, (code) => {
		if (code === false) {
			return originalCallback(new Meteor.Error('totp-canceled'));
		}
		onCode(code);
	});
}

const { call } = Meteor;
Meteor.call = function(method, ...args) {
	const callback = args.pop();

	if (typeof callback !== 'function') {
		return call(method, ...args, callback);
	}

	return call(method, ...args, function(error, result) {
		process2faReturn({
			error,
			result,
			originalCallback: callback,
			onCode: (code) => {
				call('callWith2fa', { code, method, params: args }, (error, result) => {
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
