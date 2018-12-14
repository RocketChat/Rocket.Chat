import { Meteor } from 'meteor/meteor';
import { RocketChat } from 'meteor/rocketchat:lib';

Meteor.startup(function() {
	RocketChat.MessageTypes.registerType({
		id: 'message_pinned',
		system: true,
		message: 'Pinned_a_message',
	});
});
