Meteor.startup(function() {
	return RocketChat.settings.onload('Force_SSL', function(key, value) {
		return Meteor.absoluteUrl.defaultOptions.secure = value;
	});
});
