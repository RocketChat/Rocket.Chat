import { Meteor } from 'meteor/meteor';
import { RocketChat } from 'meteor/rocketchat:lib';

Meteor.startup(function() {
	return RocketChat.settings.add('Message_AllowStarring', true, {
		type: 'boolean',
		group: 'Message',
		public: true,
	});
});
