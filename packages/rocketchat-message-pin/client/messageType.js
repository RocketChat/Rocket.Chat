import { Meteor } from 'meteor/meteor';

Meteor.startup(function() {
	RocketChat.MessageTypes.registerType({
		id: 'message_pinned',
		system: true,
		message: 'Pinned_a_message',
	});
});
