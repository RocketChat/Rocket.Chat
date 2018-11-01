import { Meteor } from 'meteor/meteor';

Meteor.startup(function() {
	RocketChat.settings.onload('Force_SSL', function(key, value) {
		Meteor.absoluteUrl.defaultOptions.secure = value;
	});
});
