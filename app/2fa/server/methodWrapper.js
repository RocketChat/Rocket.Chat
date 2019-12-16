import { Meteor } from 'meteor/meteor';

import { checkCodeForUser } from './code/index';

export function require2fa(fn) {
	return function(...args) {
		if (!this.userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'require2fa' });
		}

		if (!this.twoFactorChecked) {
			checkCodeForUser(this.userId);
		}

		return fn.apply(this, args);
	};
}
