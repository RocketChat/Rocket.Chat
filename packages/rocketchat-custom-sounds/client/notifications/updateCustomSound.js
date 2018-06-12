Meteor.startup(() =>
	RocketChat.CachedCollectionManager.onLogin(() =>
		RocketChat.Notifications.onAll('updateCustomSound', data => RocketChat.CustomSounds.update(data.soundData))
	)
);
