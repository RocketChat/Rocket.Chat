Meteor.startup(() =>
	RocketChat.Notifications.onAll('deleteCustomSound', data => RocketChat.CustomSounds.remove(data.soundData))
);
