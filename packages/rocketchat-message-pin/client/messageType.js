import { Meteor } from 'meteor/meteor';
import { MessageTypes } from 'meteor/rocketchat:ui-utils';

Meteor.startup(function() {
	MessageTypes.registerType({
		id: 'message_pinned',
		system: true,
		message: 'Pinned_a_message',
	});
});
