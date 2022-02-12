import { Meteor } from 'meteor/meteor';

import { hasRole } from '../../../authorization/server';

Meteor.methods({
	// eslint-disable-next-line @typescript-eslint/camelcase
	restart_server() {
		const uid = Meteor.userId();

		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'restart_server' });
		}

		if (hasRole(uid, 'admin') !== true) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'restart_server' });
		}

		Meteor.setTimeout(() => {
			Meteor.setTimeout(() => {
				console.warn('Call to process.exit() timed out, aborting.');
				process.abort();
			}, 1000);
			process.exit(1);
		}, 1000);

		return {
			message: 'The_server_will_restart_in_s_seconds',
			params: [2],
		};
	},
});
