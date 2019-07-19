import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../functions/hasPermission';
import { getUsersInRole } from '../functions/getUsersInRole';

Meteor.publish('usersInRole', function(roleName, scope, limit = 50) {
	console.warn('The publication "usersInRole" is deprecated and will be removed after version v2.0.0');

	if (!this.userId) {
		return this.ready();
	}

	if (!hasPermission(this.userId, 'access-permissions')) {
		return this.error(new Meteor.Error('error-not-allowed', 'Not allowed', {
			publish: 'usersInRole',
		}));
	}

	const options = {
		limit,
		sort: {
			name: 1,
		},
	};

	return getUsersInRole(roleName, scope, options);
});
