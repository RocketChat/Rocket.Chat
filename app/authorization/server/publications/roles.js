import { Meteor } from 'meteor/meteor';

import { Roles } from '../../../models';
import { clearCache } from '../functions/hasPermission';

Meteor.publish('roles', function() {
	console.warn('The publication "roles" is deprecated and will be removed after version v3.0.0');
	if (!this.userId) {
		return this.ready();
	}

	return Roles.find();
});

Roles.on('change', ({ diff }) => {
	if (diff && Object.keys(diff).length === 1 && diff._updatedAt) {
		// avoid useless changes
		return;
	}
	clearCache();
});
