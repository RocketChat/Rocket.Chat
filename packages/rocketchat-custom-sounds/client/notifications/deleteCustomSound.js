import { Meteor } from 'meteor/meteor';
import { CachedCollectionManager } from 'meteor/rocketchat:ui-cached-collection';
import { Notifications } from 'meteor/rocketchat:notifications';
import { CustomSounds } from '../lib/CustomSounds';

Meteor.startup(() =>
	CachedCollectionManager.onLogin(() =>
		Notifications.onAll('deleteCustomSound', (data) => CustomSounds.remove(data.soundData))
	)
);
