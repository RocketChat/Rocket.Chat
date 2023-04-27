import { Meteor } from 'meteor/meteor';

import { Apps } from '../../apps';
import { onInvalidateLicense } from '../../../app/license/server/license';

Meteor.startup(async () => {
	onInvalidateLicense(() => {
		Apps.disableApps();
	});
});
