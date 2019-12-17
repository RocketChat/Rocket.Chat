import { Meteor } from 'meteor/meteor';

import { checkCodeForUser } from '../code';

Meteor.methods({
	callWith2fa({ code, ddpMethod, method, params }) {
		if (!this.userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'callWith2fa' });
		}

		checkCodeForUser({ user: this.userId, code, method });

		this.twoFactorChecked = true;
		return Meteor.server.method_handlers[ddpMethod].apply(this, params);
	},
});
