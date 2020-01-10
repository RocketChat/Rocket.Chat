import { Meteor } from 'meteor/meteor';

import { WebdavAccounts } from '../../../models';

Meteor.publish('webdavAccounts', function() {
	console.warn('The publication "webdavAccounts" is deprecated and will be removed after version v3.0.0');
	if (!this.userId) {
		return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', { publish: 'webdavAccounts' }));
	}

	return WebdavAccounts.findWithUserId(this.userId, {
		fields: {
			_id: 1,
			username: 1,
			server_url: 1,
			name: 1,
		},
	});
});
