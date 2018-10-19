import { Meteor } from 'meteor/meteor';

Meteor.startup(() =>
	RocketChat.CachedCollectionManager.onLogin(() =>
		RocketChat.Notifications.onAll('updateCustomSound', (data) => RocketChat.CustomSounds.update(data.soundData))
	)
);
