import { Meteor } from 'meteor/meteor';

import { checkCodeForUser } from '../code';
import { methodOptions } from '../twoFactorRequired';

Meteor.methods({
	callWithTwoFactorRequired({ code, ddpMethod, method, params }: {code: string; ddpMethod: string; method: string; params: any[]}) {
		if (!this.userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'callWithTwoFactorRequired' });
		}

		checkCodeForUser({ user: this.userId, code, method, options: methodOptions[ddpMethod] });

		this.twoFactorChecked = true;
		return Meteor.server.method_handlers[ddpMethod].apply(this, params);
	},
});
