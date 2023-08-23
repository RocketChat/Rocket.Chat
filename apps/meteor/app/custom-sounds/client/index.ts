import { Meteor } from 'meteor/meteor';

import { Notifications } from '../../notifications/client';
import { CachedCollectionManager } from '../../ui-cached-collection/client';
import { CustomSounds } from './lib/CustomSounds';

Meteor.startup(() => {
	CachedCollectionManager.onLogin(() => {
		Notifications.onAll('public-info', ([key, data]) => {
			switch (key) {
				case 'updateCustomSound':
					CustomSounds.update(data[0].soundData);
					break;
				case 'deleteCustomSound':
					CustomSounds.remove(data[0].soundData);
					break;
			}
		});
	});
});
export { CustomSounds } from './lib/CustomSounds';
