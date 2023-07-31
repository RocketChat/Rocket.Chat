import { Meteor } from 'meteor/meteor';

import { onInvalidateLicense } from '../../../app/license/server/license';
import { Apps } from '../../apps';

Meteor.startup(() => {
	onInvalidateLicense(() => {
		void Apps.disableApps();
	});
});
