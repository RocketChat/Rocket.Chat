import { Meteor } from 'meteor/meteor';
import { settings } from '/app/settings';
import { Permissions } from '/app/models';

Meteor.startup(function() {
	settings.add('Message_AllowSnippeting', false, {
		type: 'boolean',
		public: true,
		group: 'Message',
	});
	Permissions.upsert('snippet-message', {
		$setOnInsert: {
			roles: ['owner', 'moderator', 'admin'],
		},
	});
});

