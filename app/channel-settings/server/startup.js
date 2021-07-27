import { Meteor } from 'meteor/meteor';

import { Permissions } from '../../models';

Meteor.startup(function() {
	Permissions.create('post-readonly', ['admin', 'owner', 'moderator']);
	Permissions.create('set-readonly', ['admin', 'owner']);
	Permissions.create('set-react-when-readonly', ['admin', 'owner']);
});
