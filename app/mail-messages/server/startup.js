import { Meteor } from 'meteor/meteor';

import { Permissions } from '../../models';

Meteor.startup(function() {
	return Permissions.create('access-mailer', ['admin']);
});
