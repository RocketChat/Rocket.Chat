import { Meteor } from 'meteor/meteor';

import { RateLimiter } from '../lib';
import { saveCustomFields } from '../functions/saveCustomFields';

Meteor.methods({
	saveCustomFields(fields = {}) {
		const uid = Meteor.userId();
		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'saveCustomFields' });
		}
		saveCustomFields(uid, fields);
	},
});

RateLimiter.limitMethod('saveCustomFields', 1, 1000, {
	userId() {
		return true;
	},
});
