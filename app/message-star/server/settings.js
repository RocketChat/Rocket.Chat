import { Meteor } from 'meteor/meteor';
import { settings } from '/app/settings';

Meteor.startup(function() {
	return settings.add('Message_AllowStarring', true, {
		type: 'boolean',
		group: 'Message',
		public: true,
	});
});
