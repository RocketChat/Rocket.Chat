import { Meteor } from 'meteor/meteor';
import { SHA256 } from 'meteor/sha';
import toastr from 'toastr';

import { t } from '../../utils/client';
import { imperativeModal } from '../../../client/lib/imperativeModal';
import TwoFactorModal from '../../../client/components/TwoFactorModal';


export function process2faReturn({ error, result, originalCallback, onCode, emailOrUsername }) {
	if (!error || (error.error !== 'totp-required' && error.errorType !== 'totp-required')) {
		return originalCallback(error, result);
	}

	const method = error.details && error.details.method;

	if (!emailOrUsername && Meteor.user()) {
		emailOrUsername = Meteor.user().username;
	}

	imperativeModal.open({
		component: TwoFactorModal,
		props: {
			method,
			onConfirm: (code, method) => {
				onCode(method === 'password' ? SHA256(code) : code, method);
				imperativeModal.close();
			},
			onClose: () => {
				imperativeModal.close();
				originalCallback(new Meteor.Error('totp-canceled'));
			},
			emailOrUsername,
		},
	});
}

const { call } = Meteor;
Meteor.call = function(ddpMethod, ...args) {
	let callback = args.pop();
	if (typeof callback !== 'function') {
		args.push(callback);
		callback = () => {};
	}

	return call(ddpMethod, ...args, function(error, result) {
		process2faReturn({
			error,
			result,
			originalCallback: callback,
			onCode: (code, method) => {
				call(ddpMethod, ...args, { twoFactorCode: code, twoFactorMethod: method }, (error, result) => {
					if (error && error.error === 'totp-invalid') {
						error.toastrShowed = true;
						toastr.error(t('Invalid_two_factor_code'));
						return callback(error);
					}

					callback(error, result);
				});
			},
		});
	});
};
