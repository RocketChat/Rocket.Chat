Meteor.startup(() =>
	RocketChat.Notifications.onAll('updateCustomSound', data => RocketChat.CustomSounds.update(data.soundData))
);
