import { Meteor } from 'meteor/meteor';

import { Roles } from '../../../models';
import { clear } from '../functions/hasPermission';

Meteor.publish('roles', function() {
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
	clear();
});
