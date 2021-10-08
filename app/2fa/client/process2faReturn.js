import { Meteor } from 'meteor/meteor';
import { SHA256 } from 'meteor/sha';

import { imperativeModal } from '../../../client/lib/imperativeModal';
import TwoFactorModal from '../../../client/components/TwoFactorModal';

export function process2faReturn({
	error,
	result,
	originalCallback,
	onCode,
	emailOrUsername,
}) {
	if (!error || (error.error !== 'totp-required' && error.errorType !== 'totp-required')) {
		return originalCallback(error, result);
	}

	const method = error.details?.method;

	if (!emailOrUsername) {
		emailOrUsername = Meteor.user()?.username;
	}

	imperativeModal.open({
		component: TwoFactorModal,
		props: {
			method,
			onConfirm: (code, method) => {
				imperativeModal.close();
				onCode(method === 'password' ? SHA256(code) : code, method);
			},
			onClose: () => {
				imperativeModal.close();
				originalCallback(new Meteor.Error('totp-canceled'));
			},
			emailOrUsername,
		},
	});
}
