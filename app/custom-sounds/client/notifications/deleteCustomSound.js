import { Meteor } from 'meteor/meteor';
import { CachedCollectionManager } from '/app/ui-cached-collection';
import { Notifications } from '/app/notifications';
import { CustomSounds } from '../lib/CustomSounds';

Meteor.startup(() =>
	CachedCollectionManager.onLogin(() =>
		Notifications.onAll('deleteCustomSound', (data) => CustomSounds.remove(data.soundData))
	)
);
