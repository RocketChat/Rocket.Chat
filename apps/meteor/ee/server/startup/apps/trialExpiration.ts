import { License } from '@rocket.chat/license';
import { Meteor } from 'meteor/meteor';

import { Apps } from '../../apps';

Meteor.startup(() => {
	License.onInvalidateLicense(() => {
		void Apps.disableApps();
	});
});
