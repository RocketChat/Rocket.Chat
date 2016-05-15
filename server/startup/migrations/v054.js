RocketChat.Migrations.add({
	version: 51,
	up: function() {
		// Set default message viewMode to 'normal' or 'cozy' depending on the users' current settings and remove the field 'compactView'
		var normalViewUserIds = [],
			cozyViewUserIds = [];
		RocketChat.models.Users.find().forEach(
			function(user) {
				if (user.settings && user.settings.preferences && user.settings.preferences.compactView) {
					cozyViewUserIds.push(user._id);
				} else {
					normalViewUserIds.push(user._id);
				}
			}
		);

		RocketChat.models.Users.update({_id: {$in: normalViewUserIds}}, {$set: {'settings.preferences.viewMode': 0}});
		RocketChat.models.Users.update({_id: {$in: cozyViewUserIds}}, {$set: {'settings.preferences.viewMode': 1}});
		RocketChat.models.Users.update({}, {$unset: {'settings.preferences.compactView': ''}}, {multi: true});
	}
});
