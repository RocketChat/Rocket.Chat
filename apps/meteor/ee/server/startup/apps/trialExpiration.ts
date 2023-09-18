import { onInvalidateLicense } from '@rocket.chat/license';
import { Meteor } from 'meteor/meteor';

import { Apps } from '../../apps';

Meteor.startup(() => {
	onInvalidateLicense(() => {
		void Apps.disableApps();
	});
});
