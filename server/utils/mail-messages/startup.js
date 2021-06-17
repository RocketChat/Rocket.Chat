import { Meteor } from 'meteor/meteor';

import { Permissions } from '../../../app/models';

Meteor.startup(function() {
	return Permissions.create('access-mailer', ['admin']);
});
