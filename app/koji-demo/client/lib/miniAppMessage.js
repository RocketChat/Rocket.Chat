import { Meteor } from 'meteor/meteor';

import { MessageTypes } from '../../../ui-utils/client';

Meteor.startup(function() {
	MessageTypes.registerType({
		id: 'mini-app-created',
		system: false,
		message: 'mini-app-created',
		render(message) {
			return `<iframe src=\"${ message.appUrl }\" frameborder=\"0\" height=\"533.333\"></iframe>`;
		},
	});
});
