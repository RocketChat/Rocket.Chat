import { Meteor } from 'meteor/meteor';
import _ from 'underscore';

import { Roles, Permissions } from '../../models';

Meteor.startup(() => {
	const roles = _.pluck(Roles.find().fetch(), 'name');

	if (roles.indexOf('service-account-approved') === -1) {
		Roles.createOrUpdate('service-account-approved');
	}
	if (Permissions) {
		Permissions.createOrUpdate('view-sa-request', ['admin']);
		Permissions.createOrUpdate('create-service-account', ['user', 'admin']);
		Permissions.createOrUpdate('delete-service-account', ['admin']);
	}
});
