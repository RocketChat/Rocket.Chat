import { Meteor } from 'meteor/meteor';
import { RocketChat } from 'meteor/rocketchat:lib';

Meteor.startup(() =>
	RocketChat.CachedCollectionManager.onLogin(() =>
		RocketChat.Notifications.onAll('updateCustomSound', (data) => RocketChat.CustomSounds.update(data.soundData))
	)
);
