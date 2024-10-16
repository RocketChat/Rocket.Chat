import { License } from '@rocket.chat/license';
import { Meteor } from 'meteor/meteor';

import { addSettings } from '../settings/voip';

Meteor.startup(async () => {
	License.onValidateLicense(async () => {
		await addSettings();
	});
});
