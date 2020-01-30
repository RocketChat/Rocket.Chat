import { Meteor } from 'meteor/meteor';

import { Permissions } from '../../models';

Meteor.startup(function() {
	Permissions.upsert('post-readonly', { $setOnInsert: { roles: ['admin', 'owner', 'moderator'] } });
	Permissions.upsert('set-readonly', { $setOnInsert: { roles: ['admin', 'owner'] } });
	Permissions.upsert('set-react-when-readonly', { $setOnInsert: { roles: ['admin', 'owner'] } });
});
