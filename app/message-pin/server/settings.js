import { Meteor } from 'meteor/meteor';

import { settings } from '../../settings';
import { Permissions } from '../../models';

Meteor.startup(function() {
	settings.add('Message_AllowPinning', true, {
		type: 'boolean',
		group: 'Message',
		public: true,
	});
	return Permissions.upsert('pin-message', {
		$setOnInsert: {
			roles: ['owner', 'moderator', 'admin'],
		},
	});
});
