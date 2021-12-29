import { Meteor } from 'meteor/meteor';

import { CachedCollectionManager } from '../../../ui-cached-collection';
import { Notifications } from '../../../notifications';
import { CustomSounds } from '../lib/CustomSounds';

Meteor.startup(() =>
	CachedCollectionManager.onLogin(() => Notifications.onAll('updateCustomSound', (data) => CustomSounds.update(data.soundData))),
);
