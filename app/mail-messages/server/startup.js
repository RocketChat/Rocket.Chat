import { Meteor } from 'meteor/meteor';

import { Permissions } from '../../models';

Meteor.startup(function() {
	return Permissions.createOrUpdate('access-mailer', ['admin']);
});
