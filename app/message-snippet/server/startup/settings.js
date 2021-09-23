import { Meteor } from 'meteor/meteor';

import { settings } from '../../../settings';

Meteor.startup(function() {
	settings.add('Message_AllowSnippeting', false, {
		type: 'boolean',
		public: true,
		group: 'Message',
	});
});
