Meteor.startup(() =>
	RocketChat.CachedCollectionManager.onLogin(() =>
		RocketChat.Notifications.onAll('deleteCustomSound', (data) => RocketChat.CustomSounds.remove(data.soundData))
	)
);
