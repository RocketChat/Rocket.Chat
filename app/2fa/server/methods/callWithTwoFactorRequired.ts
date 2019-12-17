import { Meteor } from 'meteor/meteor';

import { checkCodeForUser } from '../code';

Meteor.methods({
	callWithTwoFactorRequired({ code, ddpMethod, method, params }) {
		if (!this.userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'callWithTwoFactorRequired' });
		}

		checkCodeForUser({ user: this.userId, code, method });

		this.twoFactorChecked = true;
		return Meteor.server.method_handlers[ddpMethod].apply(this, params);
	},
});
