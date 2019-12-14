import { Meteor } from 'meteor/meteor';

import { checkCodeForUser } from '../code';

Meteor.methods({
	callWith2fa({ code, method, params }) {
		if (!this.userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'callWith2fa' });
		}

		checkCodeForUser(this.userId, code);

		this.twoFactorChecked = true;
		return Meteor.server.method_handlers[method].apply(this, params);
	},
});
