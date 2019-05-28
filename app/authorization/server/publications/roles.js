import { Meteor } from 'meteor/meteor';

import { Roles } from '../../../models';

Meteor.publish('roles', function() {
	if (!this.userId) {
		return this.ready();
	}

	return Roles.find();
});
