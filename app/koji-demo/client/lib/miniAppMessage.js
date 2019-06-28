import { Meteor } from 'meteor/meteor';

import { MessageTypes } from '../../../ui-utils/client';

Meteor.startup(function() {
	MessageTypes.registerType({
		id: 'mini_app_created',
		system: false,
		message: 'mini_app_created',
		data(appUrl) {
			return {
				message: `<iframe src=\"${ appUrl }\" frameborder=\"0\" height=\"533.333\"></iframe>`,
			};
		},
	});
});
