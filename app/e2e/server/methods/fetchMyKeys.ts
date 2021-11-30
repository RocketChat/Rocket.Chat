import { Meteor } from 'meteor/meteor';

import { E2E } from '../../../../server/sdk';

Meteor.methods({
	'e2e.fetchMyKeys'() {
		const uid = Meteor.userId();
		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'e2e.fetchMyKeys' });
		}

		return Promise.await(E2E.getUserKeys(uid));
	},
});
