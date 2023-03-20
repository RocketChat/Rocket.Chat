import { Meteor } from 'meteor/meteor';

import { CachedCollectionManager } from '../../../ui-cached-collection/client';
import { Notifications } from '../../../notifications/client';
import { CustomSounds } from '../lib/CustomSounds';

Meteor.startup(() =>
	CachedCollectionManager.onLogin(() => Notifications.onAll('updateCustomSound', (data) => CustomSounds.update(data.soundData))),
);
