/* eslint no-multi-spaces: 0 */
/* eslint comma-spacing: 0 */
import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

Meteor.methods({ /* microservice */
	addOAuthService(name) {
		check(name, String);
		const uid = Meteor.userId();
		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'addOAuthService' });
		}

		return RocketChat.Services.call('core.addOAuthService', { name, uid });
	},
});
