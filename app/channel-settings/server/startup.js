import { Meteor } from 'meteor/meteor';

import { Permissions } from '../../models';

Meteor.startup(function() {
	Permissions.createOrUpdate('post-readonly', ['admin', 'owner', 'moderator']);
	Permissions.createOrUpdate('set-readonly', ['admin', 'owner']);
	Permissions.createOrUpdate('set-react-when-readonly', ['admin', 'owner']);
});
