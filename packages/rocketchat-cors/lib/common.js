import { Meteor } from 'meteor/meteor';
import { RocketChat } from 'meteor/rocketchat:lib';

Meteor.startup(function() {
	RocketChat.settings.onload('Force_SSL', function(key, value) {
		Meteor.absoluteUrl.defaultOptions.secure = value;
	});
});
